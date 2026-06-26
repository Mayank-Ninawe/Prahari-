import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
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

export const FirebaseService = {
  /**
   * Creates or initializes a user document in users/{uid}
   */
  async createUserDocument(uid: string, email: string, fullName: string): Promise<UserDocument> {
    const path = `users/${uid}`;
    
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserDocument;
        if (typeof window !== "undefined") {
          localStorage.setItem(`prahari_user_${uid}`, JSON.stringify(data));
        }
        return data;
      }

      const defaultUser: UserDocument = {
        uid,
        fullName: fullName || email.split("@")[0] || "Prahari AI User",
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: "user",
        workStyle: "",
        notificationPreferences: {
          webPush: false,
          email: false
        },
        timezone: "Asia/Kolkata",
        demoModeEnabled: true
      };

      await setDoc(userRef, defaultUser);
      if (typeof window !== "undefined") {
        localStorage.setItem(`prahari_user_${uid}`, JSON.stringify(defaultUser));
      }
      return defaultUser;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for createUserDocument");
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`prahari_user_${uid}`);
          if (cached) {
            return JSON.parse(cached);
          }
          const defaultUser: UserDocument = {
            uid,
            fullName: fullName || email.split("@")[0] || "Prahari AI User",
            email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: "user",
            workStyle: "",
            notificationPreferences: {
              webPush: false,
              email: false
            },
            timezone: "Asia/Kolkata",
            demoModeEnabled: true
          };
          localStorage.setItem(`prahari_user_${uid}`, JSON.stringify(defaultUser));
          return defaultUser;
        }
      }
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches a user document
   */
  async getUserDocument(uid: string): Promise<UserDocument | null> {
    const path = `users/${uid}`;
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserDocument;
        if (typeof window !== "undefined") {
          localStorage.setItem(`prahari_user_${uid}`, JSON.stringify(data));
        }
        return data;
      }
      return null;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for getUserDocument");
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`prahari_user_${uid}`);
          if (cached) {
            return JSON.parse(cached);
          }
          // Return a temporary user doc to prevent crashes down the road
          const tempUser: UserDocument = {
            uid,
            fullName: "Prahari AI User",
            email: "user@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: "user",
            workStyle: "",
            notificationPreferences: {
              webPush: false,
              email: false
            },
            timezone: "Asia/Kolkata",
            demoModeEnabled: true
          };
          localStorage.setItem(`prahari_user_${uid}`, JSON.stringify(tempUser));
          return tempUser;
        }
      }
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Updates user settings / profile
   */
  async updateUserDocument(uid: string, data: Partial<UserDocument>): Promise<void> {
    const path = `users/${uid}`;
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`prahari_user_${uid}`);
        const current = cached ? JSON.parse(cached) : {};
        localStorage.setItem(`prahari_user_${uid}`, JSON.stringify({
          ...current,
          ...data,
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for updateUserDocument");
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`prahari_user_${uid}`);
          const current = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`prahari_user_${uid}`, JSON.stringify({
            ...current,
            ...data,
            updatedAt: new Date().toISOString()
          }));
        }
        return;
      }
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Creates a new task under users/{uid}/tasks/{taskId}
   */
  async createTask(uid: string, taskInput: {
    title: string;
    description: string;
    category: string;
    deadline: Date;
    estimatedMinutes: number;
    priority: string;
  }): Promise<string> {
    const path = `users/${uid}/tasks`;
    
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
      source: "manual"
    };

    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const tasksCollectionRef = collection(db, "users", uid, "tasks");
      const newTaskRef = doc(tasksCollectionRef);
      taskDoc.taskId = newTaskRef.id;
      const firestoreDoc = {
        ...taskDoc,
        deadline: taskInput.deadline instanceof Date && !isNaN(taskInput.deadline.getTime())
          ? Timestamp.fromDate(taskInput.deadline)
          : Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(newTaskRef, firestoreDoc);
      
      if (typeof window !== "undefined") {
        const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
        const cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
        cachedTasks.unshift(taskDoc);
        localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(cachedTasks));
      }
      return taskDoc.taskId;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for createTask");
        if (typeof window !== "undefined") {
          const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
          const cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
          cachedTasks.unshift(taskDoc);
          localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(cachedTasks));
        }
        return taskDoc.taskId;
      }
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Lists tasks for the user
   */
  async getUserTasks(uid: string): Promise<TaskDocument[]> {
    const path = `users/${uid}/tasks`;
    
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const tasksCollectionRef = collection(db, "users", uid, "tasks");
      const q = query(tasksCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const tasks: TaskDocument[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push(doc.data() as TaskDocument);
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(tasks));
      }
      return tasks;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for getUserTasks");
        if (typeof window !== "undefined") {
          const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
          if (cachedTasksStr) {
            return JSON.parse(cachedTasksStr);
          }
        }
        return [];
      }
      return handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  /**
   * Reads a single selected task
   */
  async getTask(uid: string, taskId: string): Promise<TaskDocument | null> {
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      const docSnap = await getDoc(taskRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as TaskDocument;
        return data;
      }
      return null;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for getTask");
        if (typeof window !== "undefined") {
          const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
          const cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
          const found = cachedTasks.find(t => t.taskId === taskId);
          return found || null;
        }
      }
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Updates dynamic or basic fields of a task
   */
  async updateTask(uid: string, taskId: string, data: Partial<TaskDocument>): Promise<void> {
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      await updateDoc(taskRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      if (typeof window !== "undefined") {
        const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
        let cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
        cachedTasks = cachedTasks.map(t => t.taskId === taskId ? { 
          ...t, 
          ...data, 
          updatedAt: new Date().toISOString() 
        } : t);
        localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(cachedTasks));
      }
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for updateTask");
        if (typeof window !== "undefined") {
          const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
          let cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
          cachedTasks = cachedTasks.map(t => t.taskId === taskId ? { 
            ...t, 
            ...data, 
            updatedAt: new Date().toISOString() 
          } : t);
          localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(cachedTasks));
        }
        return;
      }
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Deletes a task
   */
  async deleteTask(uid: string, taskId: string): Promise<void> {
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const taskRef = doc(db, "users", uid, "tasks", taskId);
      await deleteDoc(taskRef);
      if (typeof window !== "undefined") {
        const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
        let cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
        cachedTasks = cachedTasks.filter(t => t.taskId !== taskId);
        localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(cachedTasks));
      }
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for deleteTask");
        if (typeof window !== "undefined") {
          const cachedTasksStr = localStorage.getItem(`prahari_tasks_${uid}`);
          let cachedTasks: TaskDocument[] = cachedTasksStr ? JSON.parse(cachedTasksStr) : [];
          cachedTasks = cachedTasks.filter(t => t.taskId !== taskId);
          localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(cachedTasks));
        }
        return;
      }
      return handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Saves or overwrites a rescue plan under users/{uid}/tasks/{taskId}/rescuePlans/{planId}
   */
  async saveRescuePlan(uid: string, taskId: string, plan: Partial<RescuePlanDocument>): Promise<string> {
    const path = `users/${uid}/tasks/${taskId}/rescuePlans`;
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
      source: plan.source || "gemini"
    };

    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const rescuePlansCollection = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
      if (!planId) {
        planId = doc(rescuePlansCollection).id;
      }
      finalPlan.planId = planId;
      const planRef = doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId);
      const finalPath = `users/${uid}/tasks/${taskId}/rescuePlans/${planId}`;
      
      const firestoreDoc = {
        ...finalPlan,
        createdAt: plan.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(planRef, firestoreDoc, { merge: true });
      
      if (typeof window !== "undefined") {
        const cachedPlansStr = localStorage.getItem(`prahari_plans_${uid}_${taskId}`);
        let cachedPlans: RescuePlanDocument[] = cachedPlansStr ? JSON.parse(cachedPlansStr) : [];
        const index = cachedPlans.findIndex(p => p.planId === planId);
        if (index >= 0) {
          cachedPlans[index] = { ...cachedPlans[index], ...finalPlan };
        } else {
          cachedPlans.unshift(finalPlan);
        }
        localStorage.setItem(`prahari_plans_${uid}_${taskId}`, JSON.stringify(cachedPlans));
      }
      return planId;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for saveRescuePlan");
        if (typeof window !== "undefined") {
          const cachedPlansStr = localStorage.getItem(`prahari_plans_${uid}_${taskId}`);
          let cachedPlans: RescuePlanDocument[] = cachedPlansStr ? JSON.parse(cachedPlansStr) : [];
          const index = cachedPlans.findIndex(p => p.planId === planId);
          if (index >= 0) {
            cachedPlans[index] = { ...cachedPlans[index], ...finalPlan };
          } else {
            cachedPlans.unshift(finalPlan);
          }
          localStorage.setItem(`prahari_plans_${uid}_${taskId}`, JSON.stringify(cachedPlans));
        }
        return planId;
      }
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches all rescue plans for a specific task
   */
  async getRescuePlans(uid: string, taskId: string): Promise<RescuePlanDocument[]> {
    const path = `users/${uid}/tasks/${taskId}/rescuePlans`;
    
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const rescuePlansCollection = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
      const q = query(rescuePlansCollection, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const plans: RescuePlanDocument[] = [];
      querySnapshot.forEach((doc) => {
        plans.push(doc.data() as RescuePlanDocument);
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(`prahari_plans_${uid}_${taskId}`, JSON.stringify(plans));
      }
      return plans;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for getRescuePlans");
        if (typeof window !== "undefined") {
          const cachedPlansStr = localStorage.getItem(`prahari_plans_${uid}_${taskId}`);
          if (cachedPlansStr) {
            return JSON.parse(cachedPlansStr);
          }
        }
        return [];
      }
      
      try {
        console.warn("getRescuePlans query failed, returning standard fetch:", error);
        if (!db) {
          throw new Error("Firestore database is uninitialized");
        }
        const rescuePlansCollection = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
        const querySnapshot2 = await getDocs(rescuePlansCollection);
        const plans2: RescuePlanDocument[] = [];
        querySnapshot2.forEach((doc) => {
          plans2.push(doc.data() as RescuePlanDocument);
        });
        if (typeof window !== "undefined") {
          localStorage.setItem(`prahari_plans_${uid}_${taskId}`, JSON.stringify(plans2));
        }
        return plans2;
      } catch (err2) {
        if (isOfflineError(err2)) {
          if (typeof window !== "undefined") {
            const cachedPlansStr = localStorage.getItem(`prahari_plans_${uid}_${taskId}`);
            if (cachedPlansStr) {
              return JSON.parse(cachedPlansStr);
            }
          }
          return [];
        }
        return handleFirestoreError(err2, OperationType.LIST, path);
      }
    }
  },

  /**
   * Fetches a single rescue plan
   */
  async getRescuePlan(uid: string, taskId: string, planId: string): Promise<RescuePlanDocument | null> {
    const path = `users/${uid}/tasks/${taskId}/rescuePlans/${planId}`;
    try {
      if (!db) {
        throw new Error("Firestore database is uninitialized");
      }
      const planRef = doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId);
      const docSnap = await getDoc(planRef);
      if (docSnap.exists()) {
        return docSnap.data() as RescuePlanDocument;
      }
      return null;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for getRescuePlan");
        if (typeof window !== "undefined") {
          const cachedPlansStr = localStorage.getItem(`prahari_plans_${uid}_${taskId}`);
          const cachedPlans: RescuePlanDocument[] = cachedPlansStr ? JSON.parse(cachedPlansStr) : [];
          const found = cachedPlans.find(p => p.planId === planId);
          return found || null;
        }
      }
      return handleFirestoreError(error, OperationType.GET, path);
    }
  }
};
