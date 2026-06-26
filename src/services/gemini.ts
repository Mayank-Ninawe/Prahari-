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
};
