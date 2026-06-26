import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../config/firebase";
import { TaskDocument, FirebaseService } from "./firebaseService";

export interface NotificationDocument {
  notificationId: string;
  type: "high_risk" | "not_activated" | "compression_recommended" | "inactive_progress";
  title: string;
  body: string;
  relatedTaskId: string;
  relatedTaskTitle: string;
  escalationLevel: "passive" | "warning" | "critical";
  channel: "in_app" | "web_push" | "both";
  read: boolean;
  createdAt: any;
}

function isOfflineError(error: any): boolean {
  if (!db) return true;
  if (!error) return false;
  const msg = error.message || String(error);
  return (
    msg.includes("offline") || 
    msg.includes("client is offline") || 
    msg.includes("Failed to get document") ||
    msg.includes("Failed to query") ||
    msg.includes("uninitialized")
  );
}

export const NotificationService = {
  /**
   * Check if web notifications are supported in the current browser environment
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  },

  /**
   * Get the current browser notification permission state
   */
  getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  },

  /**
   * Explicitly request browser notification permissions from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return "denied";
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return "default";
    }
  },

  /**
   * Create and send a local browser alert if supported, permitted, and preferred
   */
  sendLocalBrowserNotification(title: string, body: string, icon = "/assets/prahari_shield.png") {
    if (!this.isSupported() || Notification.permission !== "granted") return;
    
    try {
      new Notification(title, {
        body,
        icon,
        tag: "prahari-alerts",
        requireInteraction: false
      });
    } catch (err) {
      console.warn("Could not dispatch browser notification directly:", err);
    }
  },

  /**
   * Save a notification record directly under users/{uid}/notifications/{notificationId}
   */
  async saveNotificationRecord(uid: string, data: Omit<NotificationDocument, "notificationId" | "createdAt">): Promise<string> {
    const notificationsCol = collection(db, "users", uid, "notifications");
    const notificationId = doc(notificationsCol).id;
    const notificationRef = doc(db, "users", uid, "notifications", notificationId);

    const notificationDoc: NotificationDocument = {
      ...data,
      notificationId,
      createdAt: new Date().toISOString()
    };

    try {
      const firestoreDoc = {
        ...notificationDoc,
        createdAt: serverTimestamp()
      };
      await setDoc(notificationRef, firestoreDoc);
      
      if (typeof window !== "undefined") {
        const cachedStr = localStorage.getItem(`prahari_notifications_${uid}`);
        const cached: NotificationDocument[] = cachedStr ? JSON.parse(cachedStr) : [];
        cached.unshift(notificationDoc);
        localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify(cached));
      }
      return notificationId;
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for saveNotificationRecord");
        if (typeof window !== "undefined") {
          const cachedStr = localStorage.getItem(`prahari_notifications_${uid}`);
          const cached: NotificationDocument[] = cachedStr ? JSON.parse(cachedStr) : [];
          cached.unshift(notificationDoc);
          localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify(cached));
        }
        return notificationId;
      }
      throw error;
    }
  },

  /**
   * Fetch all notifications for a specific user, sorted by most recent first
   */
  async getUserNotifications(uid: string, maxCount = 50): Promise<NotificationDocument[]> {
    const notificationsCol = collection(db, "users", uid, "notifications");
    const q = query(notificationsCol, orderBy("createdAt", "desc"), limit(maxCount));
    
    try {
      const snap = await getDocs(q);
      const notifications: NotificationDocument[] = [];
      snap.forEach((d) => {
        const item = d.data() as NotificationDocument;
        notifications.push(item);
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify(notifications));
      }
      return notifications;
    } catch (err) {
      if (isOfflineError(err)) {
        console.warn("Firestore offline - falling back to localStorage for getUserNotifications");
        if (typeof window !== "undefined") {
          const cachedStr = localStorage.getItem(`prahari_notifications_${uid}`);
          if (cachedStr) {
            return JSON.parse(cachedStr).slice(0, maxCount);
          }
        }
        return [];
      }
      
      try {
        console.warn("Failed to query notifications sorted by createdAt. Fetching unsorted fallback:", err);
        const snap = await getDocs(notificationsCol);
        const notifications: NotificationDocument[] = [];
        snap.forEach((d) => {
          notifications.push(d.data() as NotificationDocument);
        });
        const sorted = notifications.sort((a, b) => {
          const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        }).slice(0, maxCount);
        if (typeof window !== "undefined") {
          localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify(sorted));
        }
        return sorted;
      } catch (err2) {
        if (isOfflineError(err2)) {
          if (typeof window !== "undefined") {
            const cachedStr = localStorage.getItem(`prahari_notifications_${uid}`);
            if (cachedStr) {
              return JSON.parse(cachedStr).slice(0, maxCount);
            }
          }
          return [];
        }
        throw err2;
      }
    }
  },

  /**
   * Mark a specific notification as read in Firestore
   */
  async markAsRead(uid: string, notificationId: string): Promise<void> {
    const notificationRef = doc(db, "users", uid, "notifications", notificationId);
    try {
      await updateDoc(notificationRef, {
        read: true
      });
      if (typeof window !== "undefined") {
        const cachedStr = localStorage.getItem(`prahari_notifications_${uid}`);
        if (cachedStr) {
          const cached: NotificationDocument[] = JSON.parse(cachedStr);
          const updated = cached.map(n => n.notificationId === notificationId ? { ...n, read: true } : n);
          localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify(updated));
        }
      }
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - falling back to localStorage for markAsRead");
        if (typeof window !== "undefined") {
          const cachedStr = localStorage.getItem(`prahari_notifications_${uid}`);
          if (cachedStr) {
            const cached: NotificationDocument[] = JSON.parse(cachedStr);
            const updated = cached.map(n => n.notificationId === notificationId ? { ...n, read: true } : n);
            localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify(updated));
          }
        }
        return;
      }
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(uid: string, notifications: NotificationDocument[]): Promise<void> {
    const promises = notifications
      .filter((n) => !n.read)
      .map((n) => this.markAsRead(uid, n.notificationId));
    await Promise.all(promises);
  },

  /**
   * Evaluate a set of tasks against escalation rules and trigger notifications when required
   */
  async evaluateEscalationTriggers(
    uid: string, 
    tasks: TaskDocument[], 
    webPushPreference: boolean
  ): Promise<NotificationDocument[]> {
    if (!uid || tasks.length === 0) return [];

    // Load current notification records to avoid duplicates
    const existingNotifications = await this.getUserNotifications(uid, 100);
    const newRecordsToSave: Omit<NotificationDocument, "notificationId" | "createdAt">[] = [];

    for (const task of tasks) {
      // 1. High Risk Alert
      if (task.riskLevel === "critical" || task.riskLevel === "high") {
        const duplicate = existingNotifications.find(
          (n) => n.relatedTaskId === task.taskId && n.type === "high_risk"
        );
        if (!duplicate) {
          const title = `CRITICAL RISK DETECTED: "${task.title}"`;
          const body = `Prahari guard assessed a risk score of ${task.riskScore} (${task.riskLevel.toUpperCase()}) due to: ${task.riskReasonSummary || "Insufficient safety margin."}`;
          
          newRecordsToSave.push({
            type: "high_risk",
            title,
            body,
            relatedTaskId: task.taskId,
            relatedTaskTitle: task.title,
            escalationLevel: "critical",
            channel: webPushPreference ? "both" : "in_app",
            read: false
          });

          if (webPushPreference) {
            this.sendLocalBrowserNotification(title, body);
          }
        }
      }

      // 2. Tactical Rescue Path Standby (Rescue Ready but not activated yet)
      if (task.status === "rescue_ready" && task.selectedPlanId) {
        const duplicate = existingNotifications.find(
          (n) => n.relatedTaskId === task.taskId && n.type === "not_activated"
        );
        if (!duplicate) {
          const title = `DEPLOYMENT SUGGESTED: "${task.title}"`;
          const body = `A personalized rescue path has been calculated by Gemini, but has not been activated. Click to activate now and start milestone tracking.`;
          
          newRecordsToSave.push({
            type: "not_activated",
            title,
            body,
            relatedTaskId: task.taskId,
            relatedTaskTitle: task.title,
            escalationLevel: "warning",
            channel: webPushPreference ? "both" : "in_app",
            read: false
          });

          if (webPushPreference) {
            this.sendLocalBrowserNotification(title, body);
          }
        }
      }

      // 3. Compression recommended (in_progress with approaching deadline and steps remaining)
      if (task.status === "in_progress" && task.progressPercentage !== undefined && task.progressPercentage < 100) {
        // Calculate remaining minutes from task deadline compared to now
        const deadlineMillis = task.deadline instanceof Timestamp 
          ? task.deadline.toMillis() 
          : new Date(task.deadline).getTime();
        const nowMillis = Date.now();
        const remainingMinutes = Math.max(0, (deadlineMillis - nowMillis) / (1000 * 60));
        
        // If remaining minutes is less than remaining estimated task/plan duration, recommend compression
        const pendingStepsCount = (task.totalStepsCount || 0) - (task.completedStepsCount || 0);
        if (remainingMinutes > 0 && remainingMinutes < (task.estimatedMinutes || 60) && pendingStepsCount > 0) {
          const duplicate = existingNotifications.find(
            (n) => n.relatedTaskId === task.taskId && n.type === "compression_recommended"
          );
          if (!duplicate) {
            const title = `COMPRESSION SUGGESTED: "${task.title}"`;
            const body = `Deadline is only ${Math.round(remainingMinutes)} mins away with ${pendingStepsCount} steps pending. Run Prahari AI compression to prune scope instantly.`;
            
            newRecordsToSave.push({
              type: "compression_recommended",
              title,
              body,
              relatedTaskId: task.taskId,
              relatedTaskTitle: task.title,
              escalationLevel: "warning",
              channel: webPushPreference ? "both" : "in_app",
              read: false
            });

            if (webPushPreference) {
              this.sendLocalBrowserNotification(title, body);
            }
          }
        }
      }
    }

    if (newRecordsToSave.length > 0) {
      // Save all in parallel
      const savedIds = await Promise.all(
        newRecordsToSave.map(record => this.saveNotificationRecord(uid, record))
      );

      // Create full objects for local updates, sorted most-recent first
      const newNotifications: NotificationDocument[] = newRecordsToSave.map((record, index) => ({
        ...record,
        notificationId: savedIds[index],
        createdAt: new Date().toISOString()
      }));

      const combined = [...newNotifications, ...existingNotifications];
      return combined.slice(0, 50);
    }

    return existingNotifications.slice(0, 50);
  }
};
