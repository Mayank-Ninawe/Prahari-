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

export const FirebaseService = {
  /**
   * Creates or initializes a user document in users/{uid}
   */
  async createUserDocument(uid: string, email: string, fullName: string): Promise<UserDocument> {
    const userRef = doc(db, "users", uid);
    const path = `users/${uid}`;
    
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserDocument;
      }

      const defaultUser: UserDocument = {
        uid,
        fullName: fullName || email.split("@")[0] || "Prahari AI User",
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      return defaultUser;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches a user document
   */
  async getUserDocument(uid: string): Promise<UserDocument | null> {
    const userRef = doc(db, "users", uid);
    const path = `users/${uid}`;
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserDocument;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Updates user settings / profile
   */
  async updateUserDocument(uid: string, data: Partial<UserDocument>): Promise<void> {
    const userRef = doc(db, "users", uid);
    const path = `users/${uid}`;
    try {
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
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
    const tasksCollectionRef = collection(db, "users", uid, "tasks");
    const path = `users/${uid}/tasks`;
    
    try {
      // First generate/get a new document reference to obtain taskId
      const newTaskRef = doc(tasksCollectionRef);
      const taskId = newTaskRef.id;

      const taskDoc: TaskDocument = {
        taskId,
        title: taskInput.title,
        description: taskInput.description,
        category: taskInput.category,
        deadline: Timestamp.fromDate(taskInput.deadline),
        estimatedMinutes: Number(taskInput.estimatedMinutes),
        priority: taskInput.priority,
        
        // Locked defaults for Phase 5 (No AI/Gemini scoring yet)
        status: "draft",
        riskScore: 0,
        riskLevel: "safe",
        riskReasonSummary: "",
        aiLastEvaluatedAt: null,
        selectedPlanId: "",
        nextActionLabel: "",
        countdownStart: null,
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: "manual"
      };

      await setDoc(newTaskRef, taskDoc);
      return taskId;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Lists tasks for the user
   */
  async getUserTasks(uid: string): Promise<TaskDocument[]> {
    const tasksCollectionRef = collection(db, "users", uid, "tasks");
    const q = query(tasksCollectionRef, orderBy("createdAt", "desc"));
    const path = `users/${uid}/tasks`;
    
    try {
      const querySnapshot = await getDocs(q);
      const tasks: TaskDocument[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push(doc.data() as TaskDocument);
      });
      return tasks;
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  /**
   * Reads a single selected task
   */
  async getTask(uid: string, taskId: string): Promise<TaskDocument | null> {
    const taskRef = doc(db, "users", uid, "tasks", taskId);
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      const docSnap = await getDoc(taskRef);
      if (docSnap.exists()) {
        return docSnap.data() as TaskDocument;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Updates dynamic or basic fields of a task
   */
  async updateTask(uid: string, taskId: string, data: Partial<TaskDocument>): Promise<void> {
    const taskRef = doc(db, "users", uid, "tasks", taskId);
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      await updateDoc(taskRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Deletes a task
   */
  async deleteTask(uid: string, taskId: string): Promise<void> {
    const taskRef = doc(db, "users", uid, "tasks", taskId);
    const path = `users/${uid}/tasks/${taskId}`;
    try {
      await deleteDoc(taskRef);
    } catch (error) {
      return handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Saves or overwrites a rescue plan under users/{uid}/tasks/{taskId}/rescuePlans/{planId}
   */
  async saveRescuePlan(uid: string, taskId: string, plan: Partial<RescuePlanDocument>): Promise<string> {
    const rescuePlansCollection = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
    const planId = plan.planId || doc(rescuePlansCollection).id;
    const planRef = doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId);
    const path = `users/${uid}/tasks/${taskId}/rescuePlans/${planId}`;
    
    try {
      const planDoc = {
        ...plan,
        planId,
        createdAt: plan.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: plan.source || "gemini"
      };
      await setDoc(planRef, planDoc, { merge: true });
      return planId;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Fetches all rescue plans for a specific task
   */
  async getRescuePlans(uid: string, taskId: string): Promise<RescuePlanDocument[]> {
    const rescuePlansCollection = collection(db, "users", uid, "tasks", taskId, "rescuePlans");
    const q = query(rescuePlansCollection, orderBy("updatedAt", "desc"));
    const path = `users/${uid}/tasks/${taskId}/rescuePlans`;
    
    try {
      const querySnapshot = await getDocs(q);
      const plans: RescuePlanDocument[] = [];
      querySnapshot.forEach((doc) => {
        plans.push(doc.data() as RescuePlanDocument);
      });
      return plans;
    } catch (error) {
      // Fallback if index doesn't exist yet or other query error
      console.warn("getRescuePlans query failed, returning standard fetch:", error);
      const querySnapshot2 = await getDocs(rescuePlansCollection);
      const plans2: RescuePlanDocument[] = [];
      querySnapshot2.forEach((doc) => {
        plans2.push(doc.data() as RescuePlanDocument);
      });
      return plans2;
    }
  },

  /**
   * Fetches a single rescue plan
   */
  async getRescuePlan(uid: string, taskId: string, planId: string): Promise<RescuePlanDocument | null> {
    const planRef = doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId);
    const path = `users/${uid}/tasks/${taskId}/rescuePlans/${planId}`;
    try {
      const docSnap = await getDoc(planRef);
      if (docSnap.exists()) {
        return docSnap.data() as RescuePlanDocument;
      }
      return null;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  }
};
