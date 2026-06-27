import { TaskDocument } from "../services/firebaseService";

export interface RankedTask extends TaskDocument {
  computedScore: number;
  priorityReasons: string[];
  primaryReason: string;
  isBlocked: boolean;
  blockerTitle?: string;
  prerequisiteTaskId?: string;
}

const parseDateToMillis = (d: any): number => {
  if (!d) return 0;
  if (d instanceof Date) return d.getTime();
  if (typeof d === "string") return new Date(d).getTime();
  if (d && typeof d === "object") {
    if (typeof d.toDate === "function") return d.toDate().getTime();
    if (typeof d.seconds === "number") return d.seconds * 1000;
  }
  return new Date(d).getTime();
};

/**
 * Prioritizes and ranks a list of tasks using a multi-factor scoring algorithm.
 * 
 * Factors:
 * 1. Manual Priority (Input weight: up to 40 points)
 * 2. Deadline Pressure (Due soon or overdue: up to 60 points)
 * 3. AI Risk Score (Rescue severity: up to 40 points)
 * 4. Effort Awareness (Quick wins: up to 15 points)
 * 5. Blocker & Prerequisite State (Blocked tasks penalized; prerequisites elevated: +/-35 points)
 * 6. Task Status (Completed/mitigated tasks relegated)
 */
export function rankTasks(tasks: TaskDocument[]): RankedTask[] {
  const now = Date.now();
  
  // 1. Initial mapping to preserve all fields and identify block relationships
  const rankedTasks: RankedTask[] = tasks.map((t: any) => ({
    ...t,
    computedScore: 0,
    priorityReasons: [],
    primaryReason: "Standard priority",
    isBlocked: false,
    blockerTitle: undefined,
    prerequisiteTaskId: t.prerequisiteTaskId || undefined,
  }));

  // Create a fast lookup for titles & completion statuses
  const taskMap = new Map<string, RankedTask>();
  rankedTasks.forEach(t => taskMap.set(t.taskId, t));

  // Track which tasks are blocked by incomplete prerequisites
  rankedTasks.forEach((task) => {
    if (task.prerequisiteTaskId) {
      const prerequisite = taskMap.get(task.prerequisiteTaskId);
      if (prerequisite) {
        const isPrereqIncomplete = 
          prerequisite.status !== "completed" && 
          prerequisite.status !== "mitigated" && 
          prerequisite.status !== "COMPLETED";
          
        if (isPrereqIncomplete) {
          task.isBlocked = true;
          task.blockerTitle = prerequisite.title;
          
          // Elevate the prerequisite task itself so the user gets unblocked!
          prerequisite.computedScore += 35;
          const elevationMsg = `Dependency Elevation: blocks "${task.title}"`;
          if (!prerequisite.priorityReasons.includes(elevationMsg)) {
            prerequisite.priorityReasons.push(elevationMsg);
          }
        }
      }
    }
  });

  // 2. Score each task
  rankedTasks.forEach((task) => {
    // If completed or mitigated, relegate completely
    const isDone = 
      task.status === "completed" || 
      task.status === "mitigated" || 
      task.status === "COMPLETED";

    if (isDone) {
      task.computedScore = -1000;
      task.primaryReason = "Task completed";
      task.priorityReasons = ["Completed"];
      return;
    }

    let score = 0;
    const reasons: string[] = [];

    // --- FACTOR 1: Manual Priority Label ---
    const lowerPriority = (task.priority || "medium").toLowerCase();
    if (lowerPriority === "critical") {
      score += 40;
      reasons.push("Marked Critical manual priority");
    } else if (lowerPriority === "high") {
      score += 25;
      reasons.push("Marked High manual priority");
    } else if (lowerPriority === "medium") {
      score += 10;
    }

    // --- FACTOR 2: Deadline Proximity ---
    const deadlineTime = parseDateToMillis(task.deadline);
    if (deadlineTime > 0) {
      const msRemaining = deadlineTime - now;
      const hoursRemaining = msRemaining / (1000 * 60 * 60);

      if (hoursRemaining < 0) {
        // Overdue! Needs urgent attention
        score += 65;
        reasons.push("Overdue and escalating");
      } else if (hoursRemaining <= 12) {
        score += 55;
        reasons.push(`Due in less than 12 hours (${Math.ceil(hoursRemaining)}h left)`);
      } else if (hoursRemaining <= 24) {
        score += 45;
        reasons.push("Due within 24 hours");
      } else if (hoursRemaining <= 72) {
        score += 30;
        reasons.push("Due within 3 days");
      } else if (hoursRemaining <= 168) {
        score += 15;
        reasons.push("Due this week");
      } else {
        reasons.push("Due later");
      }
    } else {
      reasons.push("No due date set");
    }

    // --- FACTOR 3: AI Risk/Rescue Score ---
    if (task.riskScore && task.riskScore > 0) {
      const riskPoints = Math.round(task.riskScore * 0.4); // up to 40 points
      score += riskPoints;
      if (task.riskScore > 75) {
        reasons.push(`High AI risk level (${task.riskScore}%)`);
      } else if (task.riskScore > 40) {
        reasons.push(`Moderate risk threat (${task.riskScore}%)`);
      }
    }

    // --- FACTOR 4: Effort Awareness (Quick Wins) ---
    if (task.estimatedMinutes && task.estimatedMinutes > 0) {
      if (task.estimatedMinutes <= 60) {
        score += 15;
        reasons.push("Quick win (under 1 hour effort)");
      } else if (task.estimatedMinutes <= 180) {
        score += 8;
        reasons.push("Moderate effort (under 3 hours)");
      } else {
        reasons.push("Substantial execution effort");
      }
    }

    // --- FACTOR 5: Blocker Adjustment ---
    if (task.isBlocked) {
      score -= 30; // Deduct points because it can't be executed yet
      reasons.push(`Blocked by "${task.blockerTitle}"`);
    }

    task.computedScore += score;
    task.priorityReasons = [...task.priorityReasons, ...reasons];

    // Determine the primary explaining reason
    if (task.isBlocked) {
      task.primaryReason = `Blocked by unfinished prerequisite: ${task.blockerTitle}`;
    } else if (deadlineTime > 0 && deadlineTime < now) {
      task.primaryReason = "Overdue - immediate mitigation needed";
    } else {
      // Find the highest score contributor reason
      const sortedReasons = [...task.priorityReasons];
      const urgentReason = sortedReasons.find(r => r.includes("Due in less") || r.includes("Due within") || r.includes("Overdue"));
      const riskReason = sortedReasons.find(r => r.includes("risk") || r.includes("threat"));
      const dependencyReason = sortedReasons.find(r => r.includes("Dependency Elevation"));
      const quickWinReason = sortedReasons.find(r => r.includes("Quick win"));

      task.primaryReason = 
        dependencyReason ||
        urgentReason ||
        riskReason ||
        quickWinReason ||
        (lowerPriority === "critical" ? "Manually flagged Critical" : "Standard priority level");
    }
  });

  // 3. Stable sorting
  return rankedTasks.sort((a, b) => {
    // 1st: Computed Score descending
    if (b.computedScore !== a.computedScore) {
      return b.computedScore - a.computedScore;
    }

    // 2nd: Earliest Deadline ascending
    const deadA = parseDateToMillis(a.deadline);
    const deadB = parseDateToMillis(b.deadline);
    if (deadA !== deadB) {
      if (deadA === 0) return 1;
      if (deadB === 0) return -1;
      return deadA - deadB;
    }

    // 3rd: Highest Risk Score descending
    if (b.riskScore !== a.riskScore) {
      return b.riskScore - a.riskScore;
    }

    // 4th: Shortest Effort ascending
    if (a.estimatedMinutes !== b.estimatedMinutes) {
      return a.estimatedMinutes - b.estimatedMinutes;
    }

    // 5th: Creation date descending
    const createdA = parseDateToMillis(a.createdAt);
    const createdB = parseDateToMillis(b.createdAt);
    return createdB - createdA;
  });
}
