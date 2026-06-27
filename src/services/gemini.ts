/**
 * Prahari AI - Gemini Service Client-Side Proxy
 * Routes AI operations safely to our full-stack Express server endpoints.
 * Never calls Gemini directly from the browser, preventing API key exposure.
 */

export interface RiskAssessment {
  riskScore: number; // 0 to 100
  riskLevel: "safe" | "watch" | "critical";
  riskReasonSummary: string;
  topRiskFactors: string[];
  recommendedMode: "maintain" | "rescue" | "compress";
}

export interface RescueStep {
  stepId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  urgencyTag: "now" | "soon" | "later";
  completionType: "manual" | "review" | "submit";
}

export interface RescuePlan {
  planTitle: string;
  planSummary: string;
  steps: RescueStep[];
  totalEstimatedMinutes: number;
  firstActionLabel: string;
  survivalGoal?: string;
  droppedOrDeferred?: string[];
}

export interface PlanCompression {
  compressionMode: "not_needed" | "light" | "hard";
  compressedSummary: string;
  compressedSteps: RescueStep[];
  droppedOrDeferred: string[];
  survivalGoal: string;
}

export interface Reprioritization {
  prioritizedTaskIds: string[];
  explanation: string;
  immediateFocusTaskId: string;
  deferredTaskIds: string[];
}

export interface PersonalizedRecommendation {
  id: string;
  title: string;
  description: string;
  urgency: "critical" | "warning" | "info";
  actionLabel: string;
  actionRoute: string;
  associatedTaskId?: string;
  category?: string;
  riskOfIgnoring: string;
}

export interface PersonalizedRecommendationOutput {
  detectedPattern: "OVERLOADED" | "DEADLINE_PRESSURE" | "PROCRASTINATING" | "CATEGORY_RISK" | "LAST_HOUR_WORKER" | "UNDERESTIMATING" | "STABLE";
  patternConfidence: number;
  patternAnalysis: string;
  recommendations: PersonalizedRecommendation[];
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = localStorage.getItem("prahari_gemini_api_key");
  if (key) {
    headers["x-gemini-api-key"] = key;
  }
  return headers;
}

export const GeminiService = {
  /**
   * Assesses deadline risks given a user task payload.
   */
  async assessTaskRisk(
    task: {
      title: string;
      description: string;
      category: string;
      deadline: string;
      estimatedMinutes: number;
      priority: string;
    },
    userContext?: { workStyle?: string; aggressiveness?: string; timezone?: string }
  ): Promise<RiskAssessment> {
    try {
      const response = await fetch("/api/rescue/assess-risk", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          task,
          currentTime: new Date().toISOString(),
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assess risk: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Server returned failure");
      }
      return result.data as RiskAssessment;
    } catch (err) {
      console.error("GeminiService.assessTaskRisk client error, returning client-side fallback:", err);
      // Client-side fallback for offline or errors
      const deadlineMs = new Date(task.deadline).getTime();
      const minutesLeft = Math.max(0, Math.floor((deadlineMs - Date.now()) / (1000 * 60)));
      const score = Math.min(100, Math.max(10, (task.priority === "critical" ? 40 : 20) + (minutesLeft < task.estimatedMinutes ? 50 : 10)));
      return {
        riskScore: score,
        riskLevel: score > 75 ? "critical" : score > 35 ? "watch" : "safe",
        riskReasonSummary: "Calculated task risk (Client Fallback Mode). Time left is tight relative to estimation.",
        topRiskFactors: ["Estimated time workload vs available deadline time", "Priority level weight"],
        recommendedMode: score > 75 ? "compress" : score > 35 ? "rescue" : "maintain",
      };
    }
  },

  /**
   * Generates a compressed, high-urgency rescue execution plan.
   */
  async generateRescuePlan(
    task: {
      title: string;
      description: string;
      category: string;
      deadline: string;
      estimatedMinutes: number;
      priority: string;
    },
    riskAssessment: RiskAssessment,
    userContext?: { workStyle?: string; aggressiveness?: string }
  ): Promise<RescuePlan> {
    try {
      const response = await fetch("/api/rescue/generate-plan", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          task,
          riskAssessment,
          currentTime: new Date().toISOString(),
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate rescue plan: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Server returned failure");
      }
      return result.data as RescuePlan;
    } catch (err) {
      console.error("GeminiService.generateRescuePlan client error, returning client-side fallback:", err);
      return {
        planTitle: `Tactical Delivery Plan: ${task.title}`,
        planSummary: "High-priority tasks sequenced for quick deliverability and basic functional validation.",
        steps: [
          {
            stepId: "step_1",
            title: "Isolate Core MVP",
            description: "Determine the absolute minimum features needed. Strip away logs, optional filters, and premium styling.",
            estimatedMinutes: Math.ceil(task.estimatedMinutes * 0.3),
            urgencyTag: "now",
            completionType: "manual",
          },
          {
            stepId: "step_2",
            title: "Configure Primary Form/View",
            description: `Build out the main interaction elements for ${task.category} with local state management.`,
            estimatedMinutes: Math.ceil(task.estimatedMinutes * 0.4),
            urgencyTag: "soon",
            completionType: "review",
          },
          {
            stepId: "step_3",
            title: "Secure and Submit Write Transactions",
            description: "Conduct validation checks and push the active transaction directly to your storage layer.",
            estimatedMinutes: Math.ceil(task.estimatedMinutes * 0.3),
            urgencyTag: "later",
            completionType: "submit",
          },
        ],
        totalEstimatedMinutes: task.estimatedMinutes,
        firstActionLabel: `Begin ${task.title} Rescue`,
        survivalGoal: `Isolate and deploy core interaction elements for ${task.title} to hit the active deadline.`,
        droppedOrDeferred: [
          "Deferred extra UI layout styles, premium icons, and transition animations.",
          "Postponed secondary logger integrations and redundant console trace parameters.",
          "Dropped complex validation filters and multi-user sync hooks."
        ],
      };
    }
  },

  /**
   * Compresses a plan.
   */
  async compressRescuePlan(
    task: {
      title: string;
      description: string;
      category: string;
      deadline: string;
      estimatedMinutes: number;
    },
    originalPlan: RescuePlan,
    remainingTimeContext: string,
    userContext?: { workStyle?: string; aggressiveness?: string }
  ): Promise<PlanCompression> {
    try {
      const response = await fetch("/api/rescue/compress-plan", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          task,
          originalPlan,
          remainingTimeContext,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to compress rescue plan: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Server returned failure");
      }
      return result.data as PlanCompression;
    } catch (err) {
      console.error("GeminiService.compressRescuePlan client error, returning client-side fallback:", err);
      const reducedSteps = originalPlan.steps.slice(0, 2).map((s) => ({
        ...s,
        estimatedMinutes: Math.max(10, Math.ceil(s.estimatedMinutes * 0.6)),
        urgencyTag: "now" as const,
      }));
      return {
        compressionMode: "hard",
        compressedSummary: "Drastic workload reduction to meet the current timeline emergency (Client Fallback).",
        compressedSteps: reducedSteps,
        droppedOrDeferred: [
          "Secondary layout transitions and smooth animations",
          "Comprehensive logging parameters and console tracking features",
          "Optional filter arrays",
        ],
        survivalGoal: "Guarantee a baseline working interface for this element before the deadline.",
      };
    }
  },

  /**
   * Re-prioritizes user task list.
   */
  async reprioritizeTasks(
    selectedTask: {
      taskId: string;
      title: string;
      priority: string;
      deadline: string;
    },
    taskList: Array<{
      taskId: string;
      title: string;
      priority: string;
      deadline: string;
      riskScore?: number;
    }>
  ): Promise<Reprioritization> {
    try {
      const response = await fetch("/api/rescue/reprioritize", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          selectedTask,
          taskList,
          currentTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reprioritize: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Server returned failure");
      }
      return result.data as Reprioritization;
    } catch (err) {
      console.error("GeminiService.reprioritizeTasks client error, returning client-side fallback:", err);
      const rest = taskList.filter((t) => t.taskId !== selectedTask.taskId).map((t) => t.taskId);
      return {
        prioritizedTaskIds: [selectedTask.taskId, ...rest],
        explanation: "Critical task has been pinned to top priority (Client Fallback). Deferring other tasks to allow immediate focus.",
        immediateFocusTaskId: selectedTask.taskId,
        deferredTaskIds: rest,
      };
    }
  },

  /**
   * Evaluates task dataset behavior patterns and generates specific, high-urgency recommendations.
   */
  async getPersonalizedRecommendations(
    tasks: any[],
    userContext?: { workStyle?: string; aggressiveness?: string }
  ): Promise<PersonalizedRecommendationOutput> {
    try {
      const response = await fetch("/api/rescue/recommendations", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          tasks,
          currentTime: new Date().toISOString(),
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Server returned failure");
      }
      return result.data as PersonalizedRecommendationOutput;
    } catch (err) {
      console.error("GeminiService.getPersonalizedRecommendations client error, running deterministic local analysis:", err);
      // Perfect local fallback mapping
      return this.getLocalFallbackRecommendations(tasks);
    }
  },

  /**
   * Deterministic client-side fallback recommendation engine (runs when backend is unreachable or API fails).
   * Exact mirror of the server-side behavioral analysis engine.
   */
  getLocalFallbackRecommendations(tasks: any[]): PersonalizedRecommendationOutput {
    const now = Date.now();
    let overdueCount = 0;
    let urgentUnstartedCount = 0;
    let totalEstimatedHoursRemaining = 0;
    let daysUntilNearestDeadline = 99;
    let inactiveLongTaskCount = 0;
    const categoryRiskMap: Record<string, number> = {};
    let rescuePlanActivations = 0;

    const incompleteTasks = tasks.filter(t => t.status !== "completed" && t.status !== "mitigated");

    for (const task of tasks) {
      const isCompleted = task.status === "completed" || task.status === "mitigated";
      const deadlineMs = task.deadline ? new Date(task.deadline).getTime() : 0;
      const updatedAtMs = task.updatedAt 
        ? (typeof task.updatedAt.toMillis === "function" ? task.updatedAt.toMillis() : new Date(task.updatedAt).getTime())
        : 0;

      const estimatedHours = (task.estimatedMinutes || 0) / 60;
      const category = task.category || "Uncategorized";

      if (!isCompleted) {
        totalEstimatedHoursRemaining += estimatedHours;

        if (deadlineMs > 0 && deadlineMs < now) {
          overdueCount++;
          categoryRiskMap[category] = (categoryRiskMap[category] || 0) + 1;
        }

        const hoursLeft = deadlineMs > 0 ? (deadlineMs - now) / (1000 * 60 * 60) : 999;
        if (hoursLeft > 0 && hoursLeft <= 24 && (task.status === "draft" || !task.progressPercentage)) {
          urgentUnstartedCount++;
        }

        if (hoursLeft > 0 && (hoursLeft / 24) < daysUntilNearestDeadline) {
          daysUntilNearestDeadline = hoursLeft / 24;
        }

        const daysSinceUpdate = updatedAtMs > 0 ? (now - updatedAtMs) / (1000 * 60 * 60 * 24) : 0;
        if (estimatedHours >= 2 && daysSinceUpdate >= 3) {
          inactiveLongTaskCount++;
        }

        if (task.selectedPlanId) {
          rescuePlanActivations++;
        }
      } else {
        if (deadlineMs > 0 && updatedAtMs > deadlineMs) {
          categoryRiskMap[category] = (categoryRiskMap[category] || 0) + 1;
        }
      }
    }

    const finalDays = daysUntilNearestDeadline === 99 ? 14 : daysUntilNearestDeadline;
    const sortedIncomplete = [...incompleteTasks].sort((a, b) => {
      const aMs = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bMs = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aMs - bMs;
    });

    const primaryTask = sortedIncomplete[0];

    let pattern: "OVERLOADED" | "DEADLINE_PRESSURE" | "PROCRASTINATING" | "CATEGORY_RISK" | "LAST_HOUR_WORKER" | "UNDERESTIMATING" | "STABLE" = "STABLE";
    let analysis = "Your workload parameters and timeline buffers are within normal thresholds. Continue with execution.";
    const recs: PersonalizedRecommendation[] = [];

    if (totalEstimatedHoursRemaining > 15 && finalDays <= 2) {
      pattern = "OVERLOADED";
      analysis = `Severely overloaded with ${totalEstimatedHoursRemaining.toFixed(1)} hours of remaining estimated workload against a critical nearest deadline in ${finalDays.toFixed(1)} days. Execution parameters exceed standard limits.`;
    } else if (overdueCount > 0 || urgentUnstartedCount >= 2 || finalDays <= 1) {
      pattern = "DEADLINE_PRESSURE";
      analysis = `Severe deadline collision detected. You have ${overdueCount} overdue tasks and ${urgentUnstartedCount} unstarted tasks due immediately. Time buffers have fully evaporated.`;
    } else if (inactiveLongTaskCount >= 1 && (overdueCount > 0 || finalDays <= 3)) {
      pattern = "PROCRASTINATING";
      analysis = `Task procrastination lock. You are holding ${inactiveLongTaskCount} heavy-effort tasks (>= 2h) inactive for over 3 days, despite upcoming deadlines drawing near.`;
    } else {
      const riskCategories = Object.entries(categoryRiskMap).filter(([_, count]) => count >= 2);
      if (riskCategories.length > 0) {
        pattern = "CATEGORY_RISK";
        analysis = `Category-specific slippage pattern detected. You have a recurrent failure to deliver deadlines in the '${riskCategories[0][0]}' category (frequency: ${riskCategories[0][1]} slips).`;
      } else if (rescuePlanActivations > 0 && sortedIncomplete.some(t => t.selectedPlanId && (t.progressPercentage || 0) < 30)) {
        pattern = "UNDERESTIMATING";
        analysis = "Active Rescue Plans are failing to progress. Underestimating task friction has stalled your recovery metrics below 30%.";
      }
    }

    if (pattern === "OVERLOADED") {
      recs.push({
        id: "rec_overload_1",
        title: "Brutal Scope Compression Sequence",
        description: `You have ${totalEstimatedHoursRemaining.toFixed(1)} hours of work. Select your highest-risk task and compress its plan. Strip out non-essential styling or documentation to protect your delivery rate.`,
        urgency: "critical",
        actionLabel: "Activate Plan Compression",
        actionRoute: "rescue",
        associatedTaskId: primaryTask?.taskId,
        category: primaryTask?.category,
        riskOfIgnoring: "If neglected, you will experience cascading deadline failures. Your output across multiple streams will collapse."
      });

      if (sortedIncomplete.length > 2) {
        const secondary = sortedIncomplete[1];
        recs.push({
          id: "rec_overload_2",
          title: `Postpone Secondary Deliverable: "${secondary.title}"`,
          description: `Defer this task in the '${secondary.category}' category. Pushing its timeline back by 48 hours frees up ${(secondary.estimatedMinutes / 60).toFixed(1)} hours of immediate execution capacity.`,
          urgency: "warning",
          actionLabel: "Re-prioritize Schedule",
          actionRoute: "dashboard",
          associatedTaskId: secondary.taskId,
          category: secondary.category,
          riskOfIgnoring: "Trying to deliver all tasks concurrently will split your focus, resulting in zero tasks being completed on time."
        });
      }
    } else if (pattern === "DEADLINE_PRESSURE") {
      const overdueTasks = sortedIncomplete.filter(t => {
        const d = t.deadline ? new Date(t.deadline).getTime() : 0;
        return d > 0 && d < now;
      });

      const targetOverdue = overdueTasks[0] || primaryTask;
      
      recs.push({
        id: "rec_pressure_1",
        title: `Execute Rescue Step for: "${targetOverdue?.title || 'Main Task'}"`,
        description: `This task is overdue or due immediately. Do not try to complete the entire requirement. Go to the Rescue Page and execute the single, micro-step milestone designated for 'now'.`,
        urgency: "critical",
        actionLabel: "Open Tactical Rescue",
        actionRoute: "rescue",
        associatedTaskId: targetOverdue?.taskId,
        category: targetOverdue?.category,
        riskOfIgnoring: "Every hour of further delay deepens the backlog. Overdue items will blockade your entire pipeline and degrade user trust."
      });

      recs.push({
        id: "rec_pressure_2",
        title: "Register Push Notifications",
        description: "Configure system reminders immediately. You need proactive alerts delivered before remaining buffers hit absolute zero.",
        urgency: "info",
        actionLabel: "Enable Alert Stream",
        actionRoute: "dashboard",
        riskOfIgnoring: "Without proactive alerts, you will remain blind to approaching deadlines until after they have already failed."
      });
    } else if (pattern === "PROCRASTINATING") {
      const longTasks = sortedIncomplete.filter(t => (t.estimatedMinutes || 0) >= 120);
      const stagnantTask = longTasks[0] || primaryTask;

      recs.push({
        id: "rec_proc_1",
        title: `De-block Heavy task: "${stagnantTask?.title || 'Heavy Task'}"`,
        description: `This stagnant ${stagnantTask?.category || 'General'} task has been left untouched for over 3 days. Commit to a 15-minute diagnostic session immediately. Set up an AI Rescue Plan to crack the initial friction.`,
        urgency: "critical",
        actionLabel: "Generate Rescue Plan",
        actionRoute: "rescue",
        associatedTaskId: stagnantTask?.taskId,
        category: stagnantTask?.category,
        riskOfIgnoring: "Stagnant high-effort tasks act as mental blockades. Delaying them further makes deadline recovery mathematically impossible."
      });

      recs.push({
        id: "rec_proc_2",
        title: "Adjust Acceleration Settings",
        description: "Increase your planning aggressiveness profile in settings to enforce tighter scope constraints from the start.",
        urgency: "warning",
        actionLabel: "Calibrate Speed Profile",
        actionRoute: "profile",
        riskOfIgnoring: "Without raising acceleration thresholds, you will continue to build heavy-effort tasks that stall out in your queue."
      });
    } else if (pattern === "CATEGORY_RISK") {
      const riskCategory = Object.entries(categoryRiskMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "Compliance";
      const catTasks = sortedIncomplete.filter(t => t.category === riskCategory);
      const targetCatTask = catTasks[0] || primaryTask;

      recs.push({
        id: "rec_cat_1",
        title: `Pre-empt Recurrent "${riskCategory}" Failure`,
        description: `Historically, you frequently miss deadlines in the '${riskCategory}' category. Start your next '${riskCategory}' task immediately with a 20% estimated buffer built-in.`,
        urgency: "warning",
        actionLabel: "Pre-empt Category Task",
        actionRoute: "rescue",
        associatedTaskId: targetCatTask?.taskId,
        category: riskCategory,
        riskOfIgnoring: "This category represents your blindspot. Left unmanaged, your next project in this category will slide by default."
      });
    } else if (pattern === "UNDERESTIMATING") {
      const activeRescue = sortedIncomplete.find(t => t.selectedPlanId);
      const targetUnder = activeRescue || primaryTask;

      recs.push({
        id: "rec_under_1",
        title: `Trigger Compression on: "${targetUnder?.title || 'Active Rescue'}"`,
        description: "Your recovery metrics for this task are below 30%. Your initial time estimates were too optimistic. Trigger a plan compression to prune auxiliary steps.",
        urgency: "critical",
        actionLabel: "Compress Recovery Steps",
        actionRoute: "rescue",
        associatedTaskId: targetUnder?.taskId,
        category: targetUnder?.category,
        riskOfIgnoring: "Continuing with an optimistic timeline ensures deadline breach. Triage and scope pruning are required now."
      });
    } else {
      recs.push({
        id: "rec_stable_1",
        title: "Backlog Buffer Optimization",
        description: primaryTask 
          ? `Workload is healthy. Secure your stable parameters by reviewing '${primaryTask.title}' (due in ${finalDays.toFixed(1)} days) and preparing its environment early.`
          : "Zero outstanding tasks. Keep your queue pristine by planning your next milestone goals with clean timelines.",
        urgency: "info",
        actionLabel: primaryTask ? "Review Next Task" : "Create New Task",
        actionRoute: primaryTask ? "rescue" : "dashboard",
        associatedTaskId: primaryTask?.taskId,
        category: primaryTask?.category,
        riskOfIgnoring: "Inaction during stable periods breeds complacency. Buffer management is the key to preventing future emergencies."
      });
    }

    return {
      detectedPattern: pattern,
      patternConfidence: 85,
      patternAnalysis: analysis,
      recommendations: recs.slice(0, 3)
    };
  }
};
