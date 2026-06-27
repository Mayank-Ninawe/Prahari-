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
import { TaskDocument } from "./firebaseService";

export interface NotificationDocument {
  notificationId: string;
  type: string; // adapted to support more expressive types
  title: string;
  body: string;
  relatedTaskId: string;
  relatedTaskTitle: string;
  escalationLevel: "passive" | "warning" | "critical";
  channel: "in_app" | "web_push" | "both";
  read: boolean;
  createdAt: any;
}

export interface ReminderDecisionContext {
  taskId: string;
  title: string;
  score: number; // Reminder urgency score (0-100)
  level: "low" | "medium" | "high" | "critical";
  reason: string;
  nextBestAction: string;
  isBlocked: boolean;
  blockerTitle?: string;
  timeRemainingStr: string;
  inactivityStr: string;
  lastReminderFiredAt?: number;
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
   * Calculate a complete adaptive context-aware reminder context for a given task.
   */
  calculateTaskReminderContext(task: TaskDocument, allTasks: TaskDocument[]): ReminderDecisionContext {
    const now = Date.now();
    
    // Guard: Task already completed or mitigated needs no alerts
    const isDone = 
      task.status === "completed" || 
      task.status === "mitigated" || 
      task.status === "COMPLETED";

    if (isDone) {
      return {
        taskId: task.taskId,
        title: task.title,
        score: 0,
        level: "low",
        reason: "Task is completed or mitigated.",
        nextBestAction: "No action required.",
        isBlocked: false,
        timeRemainingStr: "completed",
        inactivityStr: "stable"
      };
    }

    // 1. Deadline calculations
    const deadlineMillis = task.deadline instanceof Timestamp 
      ? task.deadline.toMillis() 
      : new Date(task.deadline).getTime();
    
    const msRemaining = deadlineMillis - now;
    const hoursRemaining = msRemaining / (1000 * 60 * 60);

    let timeRemainingStr = "";
    if (hoursRemaining < 0) {
      const overdueHours = Math.abs(hoursRemaining);
      timeRemainingStr = overdueHours < 1 
        ? `${Math.round(overdueHours * 60)} minutes overdue` 
        : `${overdueHours.toFixed(1)} hours overdue`;
    } else {
      timeRemainingStr = hoursRemaining < 1 
        ? `due in ${Math.round(hoursRemaining * 60)} minutes` 
        : `due in ${hoursRemaining.toFixed(1)} hours`;
    }

    // 2. Blocker detection
    let isBlocked = false;
    let blockerTitle: string | undefined = undefined;
    if (task.prerequisiteTaskId) {
      const prerequisite = allTasks.find(t => t.taskId === task.prerequisiteTaskId);
      if (prerequisite) {
        const isPrereqIncomplete = 
          prerequisite.status !== "completed" && 
          prerequisite.status !== "mitigated" && 
          prerequisite.status !== "COMPLETED";
        if (isPrereqIncomplete) {
          isBlocked = true;
          blockerTitle = prerequisite.title;
        }
      }
    }

    // 3. Inactivity calculations
    const lastUpdateMillis = task.updatedAt 
      ? (task.updatedAt instanceof Timestamp ? task.updatedAt.toMillis() : new Date(task.updatedAt).getTime())
      : (task.createdAt ? (task.createdAt instanceof Timestamp ? task.createdAt.toMillis() : new Date(task.createdAt).getTime()) : now);
    
    const inactivityMs = now - lastUpdateMillis;
    const inactivityHours = Math.max(0, inactivityMs / (1000 * 60 * 60));

    let inactivityStr = "";
    if (inactivityHours < 1) {
      inactivityStr = `${Math.round(inactivityHours * 60)} minutes of inaction`;
    } else if (inactivityHours < 24) {
      inactivityStr = `${inactivityHours.toFixed(1)} hours of inaction`;
    } else {
      inactivityStr = `${(inactivityHours / 24).toFixed(1)} days of inaction`;
    }

    // 4. Score Calculation (Weighted signals)
    let score = 0;

    // A. Deadline proximity signal (up to 50 pts)
    if (hoursRemaining < 0) {
      score += 50; // Overdue
    } else if (hoursRemaining <= 2) {
      score += 48;
    } else if (hoursRemaining <= 6) {
      score += 42;
    } else if (hoursRemaining <= 12) {
      score += 35;
    } else if (hoursRemaining <= 24) {
      score += 25;
    } else if (hoursRemaining <= 48) {
      score += 15;
    } else if (hoursRemaining <= 72) {
      score += 8;
    }

    // B. Risk & Priority severity signals (up to 20 pts)
    const taskPriority = (task.priority || "medium").toLowerCase();
    if (task.riskLevel === "critical" || task.riskScore > 80) score += 10;
    else if (task.riskLevel === "high" || task.riskScore > 50) score += 6;

    if (taskPriority === "critical") score += 10;
    else if (taskPriority === "high") score += 6;

    // C. Inactivity signals (up to 20 pts)
    if (hoursRemaining < 72) { // Only increase pressure if task has some deadline pressure
      if (inactivityHours >= 48) {
        score += 20;
      } else if (inactivityHours >= 24) {
        score += 15;
      } else if (inactivityHours >= 12) {
        score += 10;
      } else if (inactivityHours >= 4) {
        score += 5;
      }
    }

    // D. Rescue Plan active factor (up to 10 pts)
    const isRescueActive = !!(task.selectedPlanId && task.status === "rescue_ready" || task.status === "in_progress");
    if (isRescueActive) {
      score += 10;
    }

    // E. Blocker Adjustment (Penalize blocked tasks to prevent executable spam)
    if (isBlocked) {
      score = Math.max(10, score - 25); // Decrease score because they can't actually work on it yet
    }

    // F. Suppress very recently modified tasks
    if (inactivityHours < 0.25) { // less than 15 mins since last update
      score = Math.max(5, score - 35); // user is actively working or just updated, suppress reminders
    }

    // 5. Categorize into Urgency Bands
    let level: "low" | "medium" | "high" | "critical" = "low";
    if (score >= 80) {
      level = "critical";
    } else if (score >= 55) {
      level = "high";
    } else if (score >= 30) {
      level = "medium";
    }

    // 6. Generate precise descriptive context
    let reason = "";
    let nextBestAction = "";

    if (isBlocked) {
      reason = `This task is blocked by prerequisite "${blockerTitle}". You cannot execute it directly.`;
      nextBestAction = `Actionable Unblocker: Work on the prerequisite task "${blockerTitle}" to unblock this task.`;
    } else if (hoursRemaining < 0) {
      reason = `Task is overdue by ${Math.abs(hoursRemaining).toFixed(1)} hours. Core deadlines are compromised.`;
      nextBestAction = `Shortest Survival action: Run Prahari AI scope compression now to salvage immediate deliverables.`;
    } else if (level === "critical") {
      const hoursLeftStr = hoursRemaining.toFixed(1);
      reason = `CRITICAL PRESSURE: Due in ${hoursLeftStr}h with ${task.estimatedMinutes} mins remaining effort. No action taken for ${inactivityHours.toFixed(1)}h.`;
      nextBestAction = isRescueActive 
        ? `Open your Active Rescue Plan immediately and start the next milestone: "${task.nextActionLabel || "Commence sprint"}"`
        : `Generate a custom Gemini Rescue Plan right now to compress scope and beat the clock.`;
    } else if (level === "high") {
      reason = `HIGH RISK WARNING: Task is due in ${hoursRemaining.toFixed(1)} hours. Left untouched for ${inactivityHours.toFixed(1)}h.`;
      nextBestAction = `Secure momentum: Accomplish a quick win step or check off progress milestones.`;
    } else if (level === "medium") {
      if (inactivityHours > 24) {
        reason = `GENTLE ALERT: Touched ${inactivityStr} ago. Due in ${hoursRemaining.toFixed(1)} hours. Inactivity is slowly raising risk.`;
        nextBestAction = `Keep on track: Spend 15 minutes drafting outline or executing initial milestones today.`;
      } else {
        reason = `MODERATE RISK: Approaching deadline (${timeRemainingStr}) with moderate effort estimated.`;
        nextBestAction = `Proactive move: Plan your execution slot or sync prerequisites.`;
      }
    } else {
      reason = `STABLE: Healthy safety margin (${hoursRemaining.toFixed(1)} hours left). Last updated ${inactivityStr}.`;
      nextBestAction = `Check in occasionally to maintain safety margin.`;
    }

    // Check if there is local reminder history to load last reminder time
    let lastReminderFiredAt: number | undefined = undefined;
    if (typeof window !== "undefined") {
      try {
        const registryRaw = localStorage.getItem(`prahari_reminder_cooldowns_${task.taskId}`);
        if (registryRaw) {
          const reg = JSON.parse(registryRaw);
          lastReminderFiredAt = reg.lastFiredAt;
        }
      } catch (_) {}
    }

    return {
      taskId: task.taskId,
      title: task.title,
      score,
      level,
      reason,
      nextBestAction,
      isBlocked,
      blockerTitle,
      timeRemainingStr,
      inactivityStr,
      lastReminderFiredAt
    };
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

    // Load current notification records
    const existingNotifications = await this.getUserNotifications(uid, 50);
    const newRecordsToSave: Omit<NotificationDocument, "notificationId" | "createdAt">[] = [];
    const now = Date.now();

    for (const task of tasks) {
      // Evaluate the dynamic reminder context for this task
      const ctx = this.calculateTaskReminderContext(task, tasks);

      // Low pressure tasks don't get alerts to avoid spamming the user
      if (ctx.level === "low") {
        continue;
      }

      // 1. Anti-spam Cooldown Verification
      let shouldAlert = false;
      let lastReg: { lastFiredAt: number; lastLevel: string } | null = null;
      const cooldownKey = `prahari_reminder_cooldowns_${task.taskId}`;

      if (typeof window !== "undefined") {
        try {
          const cachedCooldown = localStorage.getItem(cooldownKey);
          if (cachedCooldown) {
            lastReg = JSON.parse(cachedCooldown);
          }
        } catch (_) {}
      }

      // Cooldown periods:
      // Critical level: 1 hour (3600000 ms)
      // High level: 4 hours (14400000 ms)
      // Medium level: 12 hours (43200000 ms)
      let cooldownPeriod = 43200000;
      if (ctx.level === "critical") cooldownPeriod = 3600000;
      else if (ctx.level === "high") cooldownPeriod = 14400000;

      if (!lastReg) {
        // No prior reminder history, fire immediately
        shouldAlert = true;
      } else {
        const msSinceLast = now - lastReg.lastFiredAt;
        
        // Bypassing logic: If urgency has escalated (e.g. Medium -> High or High -> Critical),
        // we break through the cooldown period to warn the user instantly.
        const hasEscalated = 
          (ctx.level === "critical" && lastReg.lastLevel !== "critical") ||
          (ctx.level === "high" && lastReg.lastLevel === "medium");

        if (hasEscalated || msSinceLast >= cooldownPeriod) {
          shouldAlert = true;
        }
      }

      // If allowed by cooldown, trigger the alert
      if (shouldAlert) {
        // Build beautiful, highly contextualized alert text
        let type = "gentle_reminder";
        let title = `Reminder: "${task.title}"`;
        let body = `${ctx.reason} Suggested Next Move: ${ctx.nextBestAction}`;

        if (ctx.isBlocked) {
          type = "blocker_alert";
          title = `RESOLVE BLOCKER: "${task.title}"`;
        } else if (ctx.level === "critical") {
          type = "critical_mitigation";
          title = `🚨 CRITICAL PRESSURE: "${task.title}"`;
        } else if (ctx.level === "high") {
          type = "urgent_deadline";
          title = `⚠️ URGENT DEADLINE: "${task.title}"`;
        } else if (ctx.level === "medium" && ctx.inactivityStr.includes("days") || ctx.inactivityStr.includes("hours")) {
          type = "ignored_alert";
          title = `🕒 INACTION NOTICE: "${task.title}"`;
        }

        // Add to batch to write to Firestore & local storage
        newRecordsToSave.push({
          type,
          title,
          body,
          relatedTaskId: task.taskId,
          relatedTaskTitle: task.title,
          escalationLevel: ctx.level === "critical" ? "critical" : ctx.level === "high" ? "warning" : "passive",
          channel: webPushPreference ? "both" : "in_app",
          read: false
        });

        // Fire browser notification in real-time if preferred/granted
        if (webPushPreference) {
          this.sendLocalBrowserNotification(title, body);
        }

        // Save new cooldown record in localStorage to prevent repeat triggers
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cooldownKey, JSON.stringify({
              lastFiredAt: now,
              lastLevel: ctx.level
            }));
          } catch (_) {}
        }
      }
    }

    if (newRecordsToSave.length > 0) {
      // Save all to database in parallel
      const savedIds = await Promise.all(
        newRecordsToSave.map(record => this.saveNotificationRecord(uid, record))
      );

      // Map back to notification documents
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
