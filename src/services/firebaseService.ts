import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../config/firebase";

export interface UserDocument {
  uid: string;
  fullName: string;
  email: string;
  createdAt: any;
  updatedAt: any;
  role: string;
  workStyle: string;
  aggressiveness?: string;
  notificationPreferences: {
    webPush: boolean;
    email: boolean;
  };
  timezone: string;
  demoModeEnabled: boolean;
  pushEnabled?: boolean;
  calendarSync?: boolean;
}

export interface TaskDocument {
  taskId: string;
  title: string;
  description: string;
  category: string;
  deadline: Date | Timestamp;
  estimatedMinutes: number;
  priority: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  riskReasonSummary: string;
  aiLastEvaluatedAt: Date | Timestamp | null;
  selectedPlanId: string;
  nextActionLabel: string;
  countdownStart: Date | Timestamp | null;
  createdAt: any;
  updatedAt: any;
  source: string;
  progressPercentage?: number;
  completedStepsCount?: number;
  totalStepsCount?: number;
  prerequisiteTaskId?: string;
  survivalGoal?: string;
  goalId?: string;
  scheduledBlocks?: {
    blockId: string;
    taskId: string;
    taskTitle: string;
    title: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    explanation: string;
    isRescueBlock?: boolean;
    calendarEventId?: string;
  }[];
}

export interface RescuePlanDocument {
  planId: string;
  planTitle: string;
  planSummary: string;
  planningMode?: "autonomous" | "rescue" | "maintain";
  phases?: {
    phaseId: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    stepIds: string[];
  }[];
  steps: {
    stepId: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    urgencyTag: "now" | "soon" | "later";
    completionType: "manual" | "review" | "submit";
    isEssential?: boolean;
    phaseId?: string;
  }[];
  dependencies?: {
    stepId: string;
    dependsOnIds: string[];
  }[];
  blockers?: {
    blockerId: string;
    description: string;
    type: "technical" | "resource" | "external";
    resolutionAction: string;
    affectStepIds: string[];
  }[];
  firstAction?: {
    stepId: string;
    title: string;
    description: string;
    reason: string;
  };
  nextRecommendedStepId?: string;
  minimumViablePath?: string[];
  optionalPolishPath?: string[];
  totalEstimatedMinutes: number;
  firstActionLabel: string;
  compressionMode: "not_needed" | "light" | "hard";
  compressedSteps?: {
    stepId: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    urgencyTag: "now" | "soon" | "later";
    completionType: "manual" | "review" | "submit";
    isEssential?: boolean;
    phaseId?: string;
  }[];
  droppedOrDeferred?: string[];
  survivalGoal?: string;
  completedStepIds?: string[];
  progressPercentage?: number;
  confidence?: number;
  createdAt: any;
  updatedAt: any;
  source: string;
}

export interface GoalDocument {
  goalId: string;
  userId: string;
  title: string;
  description: string;
  targetType: "task-completion" | "numeric" | "milestone";
  targetValue?: number;
  currentValue?: number;
  deadline: Date | Timestamp;
  progressPercent: number;
  status: "active" | "at-risk" | "completed" | "paused";
  createdAt: any;
  updatedAt: any;
}

// ─── Cache Helpers ─────────────────────────────────────────────────────────────

function cacheSet(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (_) {
    return null;
  }
}

// ─── Offline Detection ─────────────────────────────────────────────────────────

function isOfflineError(error: any): boolean {
  if (!db) return true;
  if (!error) return false;
  const msg = error.message || String(error);
  return (
    msg.includes("offline") ||
    msg.includes("client is offline") ||
    msg.includes("Failed to get") ||
    msg.includes("Failed to query") ||
    msg.includes("uninitialized") ||
    msg.includes("network-request-failed")
  );
}

const isInvalidUid = (uid: string): boolean => !uid || uid === "undefined" || uid === "null";

// ─── Retry Helper for resilient Auth / Permission synchronization ───────────

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = error instanceof Error ? error.message : String(error);
    const isPermissionError = 
      errorStr.includes("permission") || 
      errorStr.includes("insufficient") || 
      errorStr.includes("PERMISSION_DENIED") ||
      errorStr.toLowerCase().includes("permission denied");
    
    if (isPermissionError) {
      console.warn("Firestore permission error detected. Failing fast without retry to prevent loops.");
      throw error;
    }

    const isTransientError = 
      errorStr.includes("unavailable") || 
      errorStr.includes("deadline-exceeded") || 
      errorStr.includes("UNAVAILABLE") ||
      errorStr.includes("DEADLINE_EXCEEDED") ||
      errorStr.includes("network") ||
      errorStr.includes("timeout");
    
    if (isTransientError && retries > 0) {
      console.warn(`Firestore transient error detected, retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

// ─── Clean undefined keys from any object before Firestore write ───────────────

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// ─── Default user builder ──────────────────────────────────────────────────────

function buildDefaultUser(uid: string, email: string, fullName: string): UserDocument {
  return {
    uid,
    fullName: fullName || email.split("@")[0] || "Prahari AI User",
    email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: "user",
    workStyle: "",
    notificationPreferences: { webPush: false, email: false },
    timezone: "Asia/Kolkata",
    demoModeEnabled: true,
  };
}

// ─── FirebaseService ───────────────────────────────────────────────────────────

export const FirebaseService = {

  // ── USER ──────────────────────────────────────────────────────────────────────

  /**
   * Creates or merges a user document.
   * Uses setDoc + merge:true — ONE round-trip instead of getDoc → setDoc.
   */
  async createUserDocument(
    uid: string,
    email: string,
    fullName: string
  ): Promise<UserDocument> {
    if (isInvalidUid(uid)) {
      console.warn("createUserDocument called with invalid/empty uid:", uid);
      return buildDefaultUser("stale_uid", email, fullName);
    }
    const cacheKey = `prahari_user_${uid}`;
    const path = `users/${uid}`;

    const defaultUser = buildDefaultUser(uid, email, fullName);

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const userRef = doc(db, "users", uid);

      // Read first to avoid overwriting existing profile fields
      const snap = await withRetry(() => getDoc(userRef));
      if (snap.exists()) {
        const existing = snap.data() as UserDocument;
        cacheSet(cacheKey, existing);
        return existing;
      }

      // New user — write once
      await withRetry(() => setDoc(userRef, defaultUser));
      cacheSet(cacheKey, defaultUser);
      return defaultUser;
    } catch (error) {
      if (isOfflineError(error)) {
        const cached = cacheGet<UserDocument>(cacheKey);
        if (cached) return cached;
        cacheSet(cacheKey, defaultUser);
        return defaultUser;
      }
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches user document. Returns cache instantly, then optionally syncs.
   */
  async getUserDocument(uid: string): Promise<UserDocument | null> {
    if (isInvalidUid(uid)) {
      console.warn("getUserDocument called with invalid/empty uid:", uid);
      return null;
    }
    const cacheKey = `prahari_user_${uid}`;
    const path = `users/${uid}`;

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const userRef = doc(db, "users", uid);
      const snap = await withRetry(() => getDoc(userRef));
      if (snap.exists()) {
        const data = snap.data() as UserDocument;
        cacheSet(cacheKey, data);
        return data;
      }
      return null;
    } catch (error) {
      if (isOfflineError(error)) {
        return cacheGet<UserDocument>(cacheKey);
      }
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Returns cached user synchronously — for immediate UI paint.
   */
  getCachedUserDocument(uid: string): UserDocument | null {
    if (isInvalidUid(uid)) return null;
    return cacheGet<UserDocument>(`prahari_user_${uid}`);
  },

  async updateUserDocument(uid: string, data: Partial<UserDocument>): Promise<void> {
    if (isInvalidUid(uid)) return;
    const cacheKey = `prahari_user_${uid}`;
    const path = `users/${uid}`;

    // Optimistic cache update first — UI reflects change instantly
    const cached = cacheGet<UserDocument>(cacheKey) ?? {};
    cacheSet(cacheKey, { ...cached, ...data, updatedAt: new Date().toISOString() });

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const userRef = doc(db, "users", uid);
      await withRetry(() => updateDoc(userRef, stripUndefined({ ...data, updatedAt: serverTimestamp() })));
    } catch (error) {
      if (isOfflineError(error)) return; // Cache already updated optimistically
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // ── TASKS ─────────────────────────────────────────────────────────────────────

  /**
   * Returns cached tasks synchronously — call this first for instant UI paint,
   * then call getUserTasks() to sync from Firebase in the background.
   */
  getCachedTasks(uid: string): TaskDocument[] {
    if (isInvalidUid(uid)) return [];
    return cacheGet<TaskDocument[]>(`prahari_tasks_${uid}`) ?? [];
  },

  /**
   * Creates a task. Optimistic cache update before Firestore write.
   */
  async createTask(
    uid: string,
    taskInput: {
      title: string;
      description: string;
      category: string;
      deadline: Date;
      estimatedMinutes: number;
      priority: string;
      prerequisiteTaskId?: string;
      goalId?: string;
    },
    tempId?: string
  ): Promise<string> {
    if (isInvalidUid(uid)) {
      console.warn("createTask called with invalid/empty uid:", uid);
      return tempId || "stale_task_id";
    }
    const path = `users/${uid}/tasks`;
    const cacheKey = `prahari_tasks_${uid}`;

    const generatedId = tempId || "task_" + Math.random().toString(36).substring(2, 11);
    const taskDoc: TaskDocument = {
      taskId: generatedId,
      title: taskInput.title,
      description: taskInput.description,
      category: taskInput.category,
      deadline: taskInput.deadline,
      estimatedMinutes: Number(taskInput.estimatedMinutes),
      priority: taskInput.priority,
      status: "draft",
      riskScore: 0,
      riskLevel: "safe",
      riskReasonSummary: "",
      aiLastEvaluatedAt: null,
      selectedPlanId: "",
      nextActionLabel: "",
      countdownStart: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual",
      prerequisiteTaskId: taskInput.prerequisiteTaskId || undefined,
      goalId: taskInput.goalId || undefined,
    };

    // Optimistic cache write — task appears in UI before Firestore confirms
    const cached = cacheGet<TaskDocument[]>(cacheKey) ?? [];
    cacheSet(cacheKey, [taskDoc, ...cached]);

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const tasksRef = collection(db, "users", uid, "tasks");
      const newRef = doc(tasksRef);
      const realId = newRef.id;

      const firestoreDoc = stripUndefined({
        ...taskDoc,
        taskId: realId,
        deadline:
          taskInput.deadline instanceof Date && !isNaN(taskInput.deadline.getTime())
            ? Timestamp.fromDate(taskInput.deadline)
            : Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await withRetry(() => setDoc(newRef, firestoreDoc));

      // Update cache with real Firestore ID only after successful server write
      const refreshed = cacheGet<TaskDocument[]>(cacheKey) ?? [];
      const updatedTaskDoc = { ...taskDoc, taskId: realId };
      cacheSet(
        cacheKey,
        refreshed.map((t) => (t.taskId === generatedId ? updatedTaskDoc : t))
      );

      if (taskInput.goalId) {
        await this.recalculateGoalProgress(uid, taskInput.goalId);
      }

      return realId;
    } catch (error) {
      // Rollback optimistic cache update on failure
      const refreshed = cacheGet<TaskDocument[]>(cacheKey) ?? [];
      cacheSet(cacheKey, refreshed.filter((t) => t.taskId !== generatedId));

      if (isOfflineError(error)) return generatedId;
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches all tasks once (getDocs). For real-time, use subscribeToTasks().
   */
  async getUserTasks(uid: string): Promise<TaskDocument[]> {
    if (isInvalidUid(uid)) return [];
    const cacheKey = `prahari_tasks_${uid}`;
    const path = `users/${uid}/tasks`;

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const tasksRef = collection(db, "users", uid, "tasks");
      const q = query(tasksRef, orderBy("createdAt", "desc"));
      const snap = await withRetry(() => getDocs(q));
      const tasks: TaskDocument[] = snap.docs.map((d) => d.data() as TaskDocument);
      cacheSet(cacheKey, tasks);
      return tasks;
    } catch (error) {
      if (isOfflineError(error)) {
        return cacheGet<TaskDocument[]>(cacheKey) ?? [];
      }
      return handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  /**
   * Real-time tasks subscription. Use this on DashboardPage instead of getUserTasks.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   *
   * Usage:
   *   useEffect(() => {
   *     const unsub = FirebaseService.subscribeToTasks(uid, (tasks) => setTasks(tasks));
   *     return unsub;
   *   }, [uid]);
   */
  subscribeToTasks(
    uid: string,
    onUpdate: (tasks: TaskDocument[]) => void
  ): () => void {
    if (isInvalidUid(uid)) {
      onUpdate([]);
      return () => {};
    }
    if (!db) {
      onUpdate(cacheGet<TaskDocument[]>(`prahari_tasks_${uid}`) ?? []);
      return () => {};
    }

    const cacheKey = `prahari_tasks_${uid}`;
    const tasksRef = collection(db, "users", uid, "tasks");
    const q = query(tasksRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const tasks = snap.docs.map((d) => d.data() as TaskDocument);
        cacheSet(cacheKey, tasks);
        onUpdate(tasks);
      },
      (error) => {
        console.warn("subscribeToTasks error:", error.message);
        onUpdate(cacheGet<TaskDocument[]>(cacheKey) ?? []);
      }
    );

    return unsub;
  },

  async getTask(uid: string, taskId: string): Promise<TaskDocument | null> {
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      if (!db) throw new Error("Firestore uninitialized");
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      const snap = await withRetry(() => getDoc(taskRef));
      return snap.exists() ? (snap.data() as TaskDocument) : null;
    } catch (error) {
      if (isOfflineError(error)) {
        const cached = cacheGet<TaskDocument[]>(`prahari_tasks_${uid}`) ?? [];
        return cached.find((t) => t.taskId === taskId) ?? null;
      }
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async updateTask(uid: string, taskId: string, data: Partial<TaskDocument>): Promise<void> {
    const cacheKey = `prahari_tasks_${uid}`;
    const path = `users/${uid}/tasks/${taskId}`;

    const cached = cacheGet<TaskDocument[]>(cacheKey) ?? [];
    const originalTask = cached.find((t) => t.taskId === taskId);

    // Optimistic update — UI reflects change instantly
    cacheSet(
      cacheKey,
      cached.map((t) =>
        t.taskId === taskId ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      )
    );

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      await withRetry(() => updateDoc(taskRef, stripUndefined({ ...data, updatedAt: serverTimestamp() })));

      const affectedGoalIds = new Set<string>();
      if (data.goalId) affectedGoalIds.add(data.goalId);
      if (originalTask && originalTask.goalId) affectedGoalIds.add(originalTask.goalId);
      for (const gid of affectedGoalIds) {
        if (gid) {
          await this.recalculateGoalProgress(uid, gid);
        }
      }
    } catch (error) {
      // Rollback optimistic update on failure
      if (originalTask) {
        const refreshed = cacheGet<TaskDocument[]>(cacheKey) ?? [];
        cacheSet(
          cacheKey,
          refreshed.map((t) => (t.taskId === taskId ? originalTask : t))
        );
      }
      if (isOfflineError(error)) return;
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteTask(uid: string, taskId: string): Promise<void> {
    const cacheKey = `prahari_tasks_${uid}`;
    const path = `users/${uid}/tasks/${taskId}`;

    const cached = cacheGet<TaskDocument[]>(cacheKey) ?? [];
    const originalTasks = [...cached];
    const originalTask = cached.find((t) => t.taskId === taskId);

    // Optimistic delete
    cacheSet(cacheKey, cached.filter((t) => t.taskId !== taskId));

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      await withRetry(() => deleteDoc(taskRef));

      if (originalTask && originalTask.goalId) {
        await this.recalculateGoalProgress(uid, originalTask.goalId);
      }
    } catch (error) {
      // Rollback optimistic delete on failure
      cacheSet(cacheKey, originalTasks);
      if (isOfflineError(error)) return;
      return handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // ── GOALS ─────────────────────────────────────────────────────────────────────

  getCachedGoals(uid: string): GoalDocument[] {
    if (isInvalidUid(uid)) return [];
    return cacheGet<GoalDocument[]>(`prahari_goals_${uid}`) ?? [];
  },

  async createGoal(
    uid: string,
    goalInput: {
      title: string;
      description: string;
      targetType: "task-completion" | "numeric" | "milestone";
      targetValue?: number;
      currentValue?: number;
      deadline: Date;
    }
  ): Promise<string> {
    if (isInvalidUid(uid)) {
      console.warn("createGoal called with invalid/empty uid:", uid);
      return "stale_goal_id";
    }
    const path = `users/${uid}/goals`;
    const cacheKey = `prahari_goals_${uid}`;

    const generatedId = "goal_" + Math.random().toString(36).substring(2, 11);
    const goalDoc: GoalDocument = {
      goalId: generatedId,
      userId: uid,
      title: goalInput.title,
      description: goalInput.description,
      targetType: goalInput.targetType,
      targetValue: goalInput.targetValue !== undefined ? Number(goalInput.targetValue) : undefined,
      currentValue: goalInput.currentValue !== undefined ? Number(goalInput.currentValue) : 0,
      deadline: goalInput.deadline,
      progressPercent: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cached = cacheGet<GoalDocument[]>(cacheKey) ?? [];
    cacheSet(cacheKey, [goalDoc, ...cached]);

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const goalsRef = collection(db, "users", uid, "goals");
      const newRef = doc(goalsRef);
      const realId = newRef.id;

      const firestoreDoc = stripUndefined({
        ...goalDoc,
        goalId: realId,
        deadline:
          goalInput.deadline instanceof Date && !isNaN(goalInput.deadline.getTime())
            ? Timestamp.fromDate(goalInput.deadline)
            : Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await withRetry(() => setDoc(newRef, firestoreDoc));

      const refreshed = cacheGet<GoalDocument[]>(cacheKey) ?? [];
      const updatedGoalDoc = {
        ...goalDoc,
        goalId: realId,
        deadline: goalInput.deadline
      };
      cacheSet(
        cacheKey,
        refreshed.map((g) => (g.goalId === generatedId ? updatedGoalDoc : g))
      );

      return realId;
    } catch (error) {
      const refreshed = cacheGet<GoalDocument[]>(cacheKey) ?? [];
      cacheSet(cacheKey, refreshed.filter((g) => g.goalId !== generatedId));

      if (isOfflineError(error)) return generatedId;
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserGoals(uid: string): Promise<GoalDocument[]> {
    if (isInvalidUid(uid)) return [];
    const cacheKey = `prahari_goals_${uid}`;
    const path = `users/${uid}/goals`;

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const goalsRef = collection(db, "users", uid, "goals");
      const q = query(goalsRef, orderBy("createdAt", "desc"));
      const snap = await withRetry(() => getDocs(q));
      const goals: GoalDocument[] = snap.docs.map((d) => d.data() as GoalDocument);
      cacheSet(cacheKey, goals);
      return goals;
    } catch (error) {
      if (isOfflineError(error)) {
        return cacheGet<GoalDocument[]>(cacheKey) ?? [];
      }
      return handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async updateGoal(uid: string, goalId: string, data: Partial<GoalDocument>): Promise<void> {
    if (isInvalidUid(uid)) return;
    const cacheKey = `prahari_goals_${uid}`;
    const path = `users/${uid}/goals/${goalId}`;

    const cached = cacheGet<GoalDocument[]>(cacheKey) ?? [];
    const originalGoal = cached.find((g) => g.goalId === goalId);

    cacheSet(
      cacheKey,
      cached.map((g) =>
        g.goalId === goalId ? { ...g, ...data, updatedAt: new Date().toISOString() } : g
      )
    );

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const goalRef = doc(db, "users", uid, "goals", goalId);

      let firestoreData = { ...data };
      if (data.deadline instanceof Date) {
        firestoreData.deadline = Timestamp.fromDate(data.deadline);
      }

      await withRetry(() => updateDoc(goalRef, stripUndefined({ ...firestoreData, updatedAt: serverTimestamp() })));

      await this.recalculateGoalProgress(uid, goalId);
    } catch (error) {
      if (originalGoal) {
        const refreshed = cacheGet<GoalDocument[]>(cacheKey) ?? [];
        cacheSet(
          cacheKey,
          refreshed.map((g) => (g.goalId === goalId ? originalGoal : g))
        );
      }
      if (isOfflineError(error)) return;
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteGoal(uid: string, goalId: string): Promise<void> {
    if (isInvalidUid(uid)) return;
    const cacheKey = `prahari_goals_${uid}`;
    const path = `users/${uid}/goals/${goalId}`;

    const cached = cacheGet<GoalDocument[]>(cacheKey) ?? [];
    const originalGoals = [...cached];

    cacheSet(cacheKey, cached.filter((g) => g.goalId !== goalId));

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const goalRef = doc(db, "users", uid, "goals", goalId);
      await withRetry(() => deleteDoc(goalRef));

      // Unlink all tasks linked to this goal
      const tasks = await this.getUserTasks(uid);
      const linkedTasks = tasks.filter((t) => t.goalId === goalId);
      for (const t of linkedTasks) {
        await this.updateTask(uid, t.taskId, { goalId: "" });
      }
    } catch (error) {
      cacheSet(cacheKey, originalGoals);
      if (isOfflineError(error)) return;
      return handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async recalculateGoalProgress(uid: string, goalId: string): Promise<void> {
    try {
      if (!db) return;
      const goalRef = doc(db, "users", uid, "goals", goalId);
      const snap = await withRetry(() => getDoc(goalRef));
      if (!snap.exists()) return;
      const goal = snap.data() as GoalDocument;

      const tasks = await this.getUserTasks(uid);
      const linkedTasks = tasks.filter((t) => t.goalId === goalId);

      const totalLinkedTasks = linkedTasks.length;
      const completedLinkedTasks = linkedTasks.filter(
        (t) => t.status === "completed" || t.status === "COMPLETED" || t.status === "mitigated"
      ).length;

      let progressPercent = 0;
      if (goal.targetType === "numeric" && goal.targetValue) {
        const currentVal = goal.currentValue || 0;
        progressPercent = Math.round((currentVal / goal.targetValue) * 100);
      } else {
        progressPercent = totalLinkedTasks > 0
          ? Math.round((completedLinkedTasks / totalLinkedTasks) * 100)
          : 0;
      }

      progressPercent = Math.min(Math.max(progressPercent, 0), 100);

      let status = goal.status || "active";
      if (progressPercent === 100 && (goal.targetType !== "task-completion" || totalLinkedTasks > 0)) {
        status = "completed";
      } else if (goal.status !== "paused") {
        const deadlineDate = goal.deadline instanceof Timestamp
          ? goal.deadline.toDate()
          : new Date(goal.deadline as any);

        const now = new Date();
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffTime < 0 && progressPercent < 100) {
          status = "at-risk";
        } else if (diffDays <= 3 && progressPercent < 50) {
          status = "at-risk";
        } else {
          status = "active";
        }
      }

      await updateDoc(goalRef, {
        progressPercent,
        status,
        updatedAt: serverTimestamp(),
      });

      const cachedGoals = cacheGet<GoalDocument[]>(`prahari_goals_${uid}`) ?? [];
      cacheSet(
        `prahari_goals_${uid}`,
        cachedGoals.map((g) =>
          g.goalId === goalId
            ? { ...g, progressPercent, status, updatedAt: new Date().toISOString() }
            : g
        )
      );
    } catch (err) {
      console.error("Failed to recalculate goal progress:", err);
    }
  },

  // ── RESCUE PLANS ──────────────────────────────────────────────────────────────

  async saveRescuePlan(
    uid: string,
    taskId: string,
    plan: Partial<RescuePlanDocument>
  ): Promise<string> {
    const path = `users/${uid}/tasks/${taskId}/rescuePlans`;
    const cacheKey = `prahari_plans_${uid}_${taskId}`;

    let planId = plan.planId || "";

    const finalPlan: RescuePlanDocument = {
      planId,
      planTitle: plan.planTitle || "Rescue Plan",
      planSummary: plan.planSummary || "",
      planningMode: plan.planningMode,
      phases: plan.phases,
      steps: plan.steps || [],
      dependencies: plan.dependencies,
      blockers: plan.blockers,
      firstAction: plan.firstAction,
      nextRecommendedStepId: plan.nextRecommendedStepId,
      minimumViablePath: plan.minimumViablePath,
      optionalPolishPath: plan.optionalPolishPath,
      totalEstimatedMinutes: plan.totalEstimatedMinutes || 0,
      firstActionLabel: plan.firstActionLabel || "First Action",
      compressionMode: plan.compressionMode || "not_needed",
      compressedSteps: plan.compressedSteps,
      droppedOrDeferred: plan.droppedOrDeferred,
      survivalGoal: plan.survivalGoal,
      completedStepIds: plan.completedStepIds,
      progressPercentage: plan.progressPercentage,
      confidence: plan.confidence,
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: plan.source || "gemini",
    };

    // Optimistic cache write
    const cached = cacheGet<RescuePlanDocument[]>(cacheKey) ?? [];
    const idx = cached.findIndex((p) => p.planId === planId);
    if (idx >= 0) cached[idx] = { ...cached[idx], ...finalPlan };
    else cached.unshift(finalPlan);
    cacheSet(cacheKey, cached);

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const plansRef = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
      if (!planId) {
        planId = doc(plansRef).id;
        finalPlan.planId = planId;
      }

      const planRef = doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId);
      await setDoc(
        planRef,
        stripUndefined({
          ...finalPlan,
          createdAt: plan.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );

      return planId;
    } catch (error) {
      if (isOfflineError(error)) return planId;
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getRescuePlans(uid: string, taskId: string): Promise<RescuePlanDocument[]> {
    const cacheKey = `prahari_plans_${uid}_${taskId}`;
    const path = `users/${uid}/tasks/${taskId}/rescuePlans`;

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const plansRef = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
      const q = query(plansRef, orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      const plans = snap.docs.map((d) => d.data() as RescuePlanDocument);
      cacheSet(cacheKey, plans);
      return plans;
    } catch (error) {
      if (isOfflineError(error)) {
        return cacheGet<RescuePlanDocument[]>(cacheKey) ?? [];
      }
      return handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  /**
   * Returns cached rescue plans synchronously — for instant UI paint.
   */
  getCachedRescuePlans(uid: string, taskId: string): RescuePlanDocument[] {
    return cacheGet<RescuePlanDocument[]>(`prahari_plans_${uid}_${taskId}`) ?? [];
  },

  async getRescuePlan(
    uid: string,
    taskId: string,
    planId: string
  ): Promise<RescuePlanDocument | null> {
    const path = `users/${uid}/tasks/${taskId}/rescuePlans/${planId}`;
    try {
      if (!db) throw new Error("Firestore uninitialized");
      const planRef = doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId);
      const snap = await getDoc(planRef);
      return snap.exists() ? (snap.data() as RescuePlanDocument) : null;
    } catch (error) {
      if (isOfflineError(error)) {
        const cached = cacheGet<RescuePlanDocument[]>(`prahari_plans_${uid}_${taskId}`) ?? [];
        return cached.find((p) => p.planId === planId) ?? null;
      }
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },
};