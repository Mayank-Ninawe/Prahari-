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
}

export interface RescuePlanDocument {
  planId: string;
  planTitle: string;
  planSummary: string;
  steps: {
    stepId: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    urgencyTag: "now" | "soon" | "later";
    completionType: "manual" | "review" | "submit";
  }[];
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
  }[];
  droppedOrDeferred?: string[];
  survivalGoal?: string;
  completedStepIds?: string[];
  progressPercentage?: number;
  createdAt: any;
  updatedAt: any;
  source: string;
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
    const cacheKey = `prahari_user_${uid}`;
    const path = `users/${uid}`;

    const defaultUser = buildDefaultUser(uid, email, fullName);

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const userRef = doc(db, "users", uid);

      // Read first to avoid overwriting existing profile fields
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const existing = snap.data() as UserDocument;
        cacheSet(cacheKey, existing);
        return existing;
      }

      // New user — write once
      await setDoc(userRef, defaultUser);
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
    const cacheKey = `prahari_user_${uid}`;
    const path = `users/${uid}`;

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
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
    return cacheGet<UserDocument>(`prahari_user_${uid}`);
  },

  async updateUserDocument(uid: string, data: Partial<UserDocument>): Promise<void> {
    const cacheKey = `prahari_user_${uid}`;
    const path = `users/${uid}`;

    // Optimistic cache update first — UI reflects change instantly
    const cached = cacheGet<UserDocument>(cacheKey) ?? {};
    cacheSet(cacheKey, { ...cached, ...data, updatedAt: new Date().toISOString() });

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, stripUndefined({ ...data, updatedAt: serverTimestamp() }));
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
    }
  ): Promise<string> {
    const path = `users/${uid}/tasks`;
    const cacheKey = `prahari_tasks_${uid}`;

    const generatedId = "task_" + Math.random().toString(36).substring(2, 11);
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
    };

    // Optimistic cache write — task appears in UI before Firestore confirms
    const cached = cacheGet<TaskDocument[]>(cacheKey) ?? [];
    cacheSet(cacheKey, [taskDoc, ...cached]);

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const tasksRef = collection(db, "users", uid, "tasks");
      const newRef = doc(tasksRef);
      taskDoc.taskId = newRef.id;

      // Update cache with real Firestore ID
      const refreshed = cacheGet<TaskDocument[]>(cacheKey) ?? [];
      cacheSet(
        cacheKey,
        refreshed.map((t) => (t.taskId === generatedId ? taskDoc : t))
      );

      const firestoreDoc = stripUndefined({
        ...taskDoc,
        deadline:
          taskInput.deadline instanceof Date && !isNaN(taskInput.deadline.getTime())
            ? Timestamp.fromDate(taskInput.deadline)
            : Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(newRef, firestoreDoc);
      return taskDoc.taskId;
    } catch (error) {
      if (isOfflineError(error)) return taskDoc.taskId; // Cache already has it
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches all tasks once (getDocs). For real-time, use subscribeToTasks().
   */
  async getUserTasks(uid: string): Promise<TaskDocument[]> {
    const cacheKey = `prahari_tasks_${uid}`;
    const path = `users/${uid}/tasks`;

    try {
      if (!db) throw new Error("Firestore uninitialized");

      const tasksRef = collection(db, "users", uid, "tasks");
      const q = query(tasksRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
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
      const snap = await getDoc(taskRef);
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

    // Optimistic update — UI reflects change instantly
    const cached = cacheGet<TaskDocument[]>(cacheKey) ?? [];
    cacheSet(
      cacheKey,
      cached.map((t) =>
        t.taskId === taskId ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      )
    );

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      await updateDoc(taskRef, stripUndefined({ ...data, updatedAt: serverTimestamp() }));
    } catch (error) {
      if (isOfflineError(error)) return;
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteTask(uid: string, taskId: string): Promise<void> {
    const cacheKey = `prahari_tasks_${uid}`;
    const path = `users/${uid}/tasks/${taskId}`;

    // Optimistic delete
    const cached = cacheGet<TaskDocument[]>(cacheKey) ?? [];
    cacheSet(cacheKey, cached.filter((t) => t.taskId !== taskId));

    try {
      if (!db) throw new Error("Firestore uninitialized");
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      if (isOfflineError(error)) return;
      return handleFirestoreError(error, OperationType.DELETE, path);
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
      steps: plan.steps || [],
      totalEstimatedMinutes: plan.totalEstimatedMinutes || 0,
      firstActionLabel: plan.firstActionLabel || "First Action",
      compressionMode: plan.compressionMode || "not_needed",
      compressedSteps: plan.compressedSteps,
      droppedOrDeferred: plan.droppedOrDeferred,
      survivalGoal: plan.survivalGoal,
      completedStepIds: plan.completedStepIds,
      progressPercentage: plan.progressPercentage,
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