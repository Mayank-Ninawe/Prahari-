import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure the API key exists or fallback gracefully
const apiKey = process.env.GEMINI_API_KEY;

export function getAIClient(customKey?: string): GoogleGenAI | null {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

let ai = getAIClient();
if (!ai) {
  console.warn("GEMINI_API_KEY is not defined in environment variables. Gemini features will run in mock/fallback mode.");
}

// -------------------------------------------------------------------------
// TYPINGS
// -------------------------------------------------------------------------

export interface RiskAssessmentOutput {
  riskScore: number;
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

export interface RescuePlanOutput {
  planTitle: string;
  planSummary: string;
  steps: RescueStep[];
  totalEstimatedMinutes: number;
  firstActionLabel: string;
}

export interface PlanCompressionOutput {
  compressionMode: "not_needed" | "light" | "hard";
  compressedSummary: string;
  compressedSteps: RescueStep[];
  droppedOrDeferred: string[];
  survivalGoal: string;
}

export interface ReprioritizationOutput {
  prioritizedTaskIds: string[];
  explanation: string;
  immediateFocusTaskId: string;
  deferredTaskIds: string[];
}

// -------------------------------------------------------------------------
// REUSABLE SCHEMAS (using Type from @google/genai)
// -------------------------------------------------------------------------

const riskAssessmentSchema = {
  type: Type.OBJECT,
  properties: {
    riskScore: { type: Type.INTEGER, description: "Risk score from 0 to 100 based on urgency, remaining time, priority and description." },
    riskLevel: { type: Type.STRING, description: "Must be one of: 'safe', 'watch', 'critical'." },
    riskReasonSummary: { type: Type.STRING, description: "A concise summary of why the task is at risk or safe." },
    topRiskFactors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of 2-4 short, specific reasons for the risk level."
    },
    recommendedMode: { type: Type.STRING, description: "Recommended next step: 'maintain' (risk <= 30), 'rescue' (30 < risk <= 70), 'compress' (risk > 70)." }
  },
  required: ["riskScore", "riskLevel", "riskReasonSummary", "topRiskFactors", "recommendedMode"]
};

const rescueStepSchema = {
  type: Type.OBJECT,
  properties: {
    stepId: { type: Type.STRING, description: "Unique ID for the step, e.g., 'step_1', 'step_2'." },
    title: { type: Type.STRING, description: "Actionable title for this rescue step." },
    description: { type: Type.STRING, description: "Specific details on how to perform this rescue step." },
    estimatedMinutes: { type: Type.INTEGER, description: "Estimated time to complete this step in minutes." },
    urgencyTag: { type: Type.STRING, description: "Must be one of: 'now', 'soon', 'later'." },
    completionType: { type: Type.STRING, description: "Must be one of: 'manual', 'review', 'submit'." }
  },
  required: ["stepId", "title", "description", "estimatedMinutes", "urgencyTag", "completionType"]
};

const rescuePlanSchema = {
  type: Type.OBJECT,
  properties: {
    planTitle: { type: Type.STRING, description: "Optimistic and operational rescue plan title." },
    planSummary: { type: Type.STRING, description: "Overview of the rescue strategy focus." },
    steps: {
      type: Type.ARRAY,
      items: rescueStepSchema,
      description: "List of actionable steps needed to complete the task successfully."
    },
    totalEstimatedMinutes: { type: Type.INTEGER, description: "Sum of estimatedMinutes of all steps." },
    firstActionLabel: { type: Type.STRING, description: "Concise action call to display on the button, e.g., 'Verify database security schema'." }
  },
  required: ["planTitle", "planSummary", "steps", "totalEstimatedMinutes", "firstActionLabel"]
};

const planCompressionSchema = {
  type: Type.OBJECT,
  properties: {
    compressionMode: { type: Type.STRING, description: "Must be one of: 'not_needed', 'light', 'hard'." },
    compressedSummary: { type: Type.STRING, description: "Summary explaining the compression and what is prioritized." },
    compressedSteps: {
      type: Type.ARRAY,
      items: rescueStepSchema,
      description: "Compressed list of core steps focusing on Minimum Viable Target (MVT) delivery."
    },
    droppedOrDeferred: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Details of nonessential scope, documentation, or fluff dropped or deferred."
    },
    survivalGoal: { type: Type.STRING, description: "The single ultimate goal to guarantee basic submission safety." }
  },
  required: ["compressionMode", "compressedSummary", "compressedSteps", "droppedOrDeferred", "survivalGoal"]
};

const reprioritizationSchema = {
  type: Type.OBJECT,
  properties: {
    prioritizedTaskIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Task IDs ordered from most critical / highest urgency to lowest."
    },
    explanation: { type: Type.STRING, description: "Short string explaining why these tasks are ordered this way." },
    immediateFocusTaskId: { type: Type.STRING, description: "The single most critical task ID that the developer must do first." },
    deferredTaskIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Task IDs that are deferred/pushed down to free up immediately needed bandwidth."
    }
  },
  required: ["prioritizedTaskIds", "explanation", "immediateFocusTaskId", "deferredTaskIds"]
};

// -------------------------------------------------------------------------
// MODULE SERVICE IMPLEMENTATIONS
// -------------------------------------------------------------------------

export const GeminiService = {
  /**
   * Module 1: Risk Assessment
   * Evaluates a task to calculate risk score, level, factors, and recommended mode.
   */
  async assessTaskRisk(
    task: {
      title: string;
      description: string;
      category: string;
      deadline: string | Date;
      estimatedMinutes: number;
      priority: string;
    },
    currentTime: string = new Date().toISOString(),
    userContext?: { workStyle?: string; aggressiveness?: string; timezone?: string },
    customKey?: string
  ): Promise<RiskAssessmentOutput> {
    const activeClient = getAIClient(customKey);
    if (!activeClient) {
      return this.getFallbackRiskAssessment(task, currentTime);
    }

    try {
      const deadlineStr = task.deadline instanceof Date ? task.deadline.toISOString() : String(task.deadline);
      
      const prompt = `
        Evaluate deadline failure risk for this operational workspace task.
        
        Current Time: ${currentTime}
        Task Info:
        - Title: "${task.title}"
        - Description: "${task.description}"
        - Category: "${task.category}"
        - Deadline: "${deadlineStr}"
        - Estimated Minutes Required: ${task.estimatedMinutes}
        - User Set Priority: "${task.priority}"
        
        User Work Settings:
        - Work Style: "${userContext?.workStyle || "normal"}"
        - Compression Aggressiveness: "${userContext?.aggressiveness || "medium"}"

        Analyze remaining time vs estimatedMinutes. Account for category and description complexity.
        Produce a highly precise structured JSON response.
      `;

      const response = await activeClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the core risk analysis engine of Prahari AI, a high-precision operational rescue system. Analyze deadline risk score (0 to 100), level (safe, watch, critical), factors, and modes. Keep summaries brief, professional, and directly actionable. Avoid conversational pleasantries.",
          responseMimeType: "application/json",
          responseSchema: riskAssessmentSchema,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || "";
      const parsed = JSON.parse(text) as RiskAssessmentOutput;
      
      // Validation & Sanitization
      parsed.riskScore = Math.max(0, Math.min(100, Number(parsed.riskScore) || 0));
      if (!["safe", "watch", "critical"].includes(parsed.riskLevel)) {
        parsed.riskLevel = parsed.riskScore > 75 ? "critical" : parsed.riskScore > 35 ? "watch" : "safe";
      }
      if (!["maintain", "rescue", "compress"].includes(parsed.recommendedMode)) {
        parsed.recommendedMode = parsed.riskLevel === "critical" ? "compress" : parsed.riskLevel === "watch" ? "rescue" : "maintain";
      }

      return parsed;
    } catch (err) {
      console.error("Error in assessTaskRisk, invoking fallback:", err);
      return this.getFallbackRiskAssessment(task, currentTime);
    }
  },

  /**
   * Module 2: Rescue Plan Generation
   * Generates a concrete, tactical rescue plan for an at-risk task.
   */
  async generateRescuePlan(
    task: {
      title: string;
      description: string;
      category: string;
      deadline: string | Date;
      estimatedMinutes: number;
      priority: string;
    },
    riskAssessment: RiskAssessmentOutput,
    currentTime: string = new Date().toISOString(),
    userContext?: { workStyle?: string; aggressiveness?: string },
    customKey?: string
  ): Promise<RescuePlanOutput> {
    const activeClient = getAIClient(customKey);
    if (!activeClient) {
      return this.getFallbackRescuePlan(task);
    }

    try {
      const deadlineStr = task.deadline instanceof Date ? task.deadline.toISOString() : String(task.deadline);
      const prompt = `
        Create an actionable milestone-based rescue plan to guarantee deadline delivery.
        
        Current Time: ${currentTime}
        Task Info:
        - Title: "${task.title}"
        - Description: "${task.description}"
        - Category: "${task.category}"
        - Deadline: "${deadlineStr}"
        - Estimated Minutes: ${task.estimatedMinutes}
        - Priority: "${task.priority}"
        
        Risk Analysis:
        - Risk Score: ${riskAssessment.riskScore}/100
        - Risk Level: "${riskAssessment.riskLevel}"
        - Risk Reason: "${riskAssessment.riskReasonSummary}"

        User Settings:
        - Work Style: "${userContext?.workStyle || "normal"}"

        Generate 3 to 5 realistic, step-by-step actions. Provide concrete titles and clear completion instructions. Avoid vague generic text.
      `;

      const response = await activeClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Operational Rescue Planner for Prahari AI. Your role is to break down failing tasks into highly tactical milestone steps. Give precise descriptions of deliverables, estimated effort, and completion types. Do not use generic productivity tips.",
          responseMimeType: "application/json",
          responseSchema: rescuePlanSchema,
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || "";
      return JSON.parse(text) as RescuePlanOutput;
    } catch (err) {
      console.error("Error in generateRescuePlan, invoking fallback:", err);
      return this.getFallbackRescuePlan(task);
    }
  },

  /**
   * Module 3: Plan Compression
   * Compresses an existing plan to meet aggressive time constraints.
   */
  async compressRescuePlan(
    task: {
      title: string;
      description: string;
      category: string;
      deadline: string | Date;
      estimatedMinutes: number;
    },
    originalPlan: RescuePlanOutput,
    remainingTimeContext: string,
    userContext?: { workStyle?: string; aggressiveness?: string },
    customKey?: string
  ): Promise<PlanCompressionOutput> {
    const activeClient = getAIClient(customKey);
    if (!activeClient) {
      return this.getFallbackPlanCompression(originalPlan);
    }

    try {
      const prompt = `
        COMPRESS this rescue plan into an absolute minimum viable completion path (MVT).
        
        Original Task: "${task.title}"
        Description: "${task.description}"
        Category: "${task.category}"
        
        Remaining Available Time Context: "${remainingTimeContext}"
        Current Plan Effort Needed: ${originalPlan.totalEstimatedMinutes} minutes.
        User Aggressiveness Setting: "${userContext?.aggressiveness || "medium"}"

        Original Plan Steps:
        ${JSON.stringify(originalPlan.steps, null, 2)}

        Identify nonessential work to drop (e.g., secondary analytics, verbose docs, extensive unit tests). 
        Structure 2-3 hyper-focused survival steps that guarantee basic functional validation.
      `;

      const response = await activeClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Plan Compression Engine of Prahari AI. Your job is to enforce hard scope reduction. Be brutal: defer logging, testing, and nice-to-haves. Retain ONLY core operational items. Formulate a highly precise structured JSON response.",
          responseMimeType: "application/json",
          responseSchema: planCompressionSchema,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || "";
      return JSON.parse(text) as PlanCompressionOutput;
    } catch (err) {
      console.error("Error in compressRescuePlan, invoking fallback:", err);
      return this.getFallbackPlanCompression(originalPlan);
    }
  },

  /**
   * Module 4: Reprioritization
   * Reprioritizes all current tasks relative to an urgent selected task.
   */
  async reprioritizeTasks(
    selectedTask: {
      taskId: string;
      title: string;
      priority: string;
      deadline: string | Date;
    },
    taskList: Array<{
      taskId: string;
      title: string;
      priority: string;
      deadline: string | Date;
      riskScore?: number;
    }>,
    currentTime: string = new Date().toISOString(),
    customKey?: string
  ): Promise<ReprioritizationOutput> {
    const activeClient = getAIClient(customKey);
    if (!activeClient) {
      return this.getFallbackReprioritization(selectedTask, taskList);
    }

    try {
      const prompt = `
        Re-prioritize the user's workspace tasks. A specific task has experienced high urgency or risk.
        
        Current Time: ${currentTime}
        Selected Critical Task:
        - Task ID: "${selectedTask.taskId}"
        - Title: "${selectedTask.title}"
        - Current Priority: "${selectedTask.priority}"
        - Deadline: "${selectedTask.deadline}"

        Full Current Task List:
        ${JSON.stringify(taskList, null, 2)}

        Order the entire list of tasks to optimize delivery. Prahari favors routing high-risk or immediate hard deadlines to the top.
        Defer non-critical high-effort tasks to later. Output structured IDs in recommended execution order.
      `;

      const response = await activeClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Reprioritization Engine of Prahari AI. You order tasks by criticality and timeline. Provide an execution-ready sorted array of IDs and a concise explanation of the rationale.",
          responseMimeType: "application/json",
          responseSchema: reprioritizationSchema,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || "";
      return JSON.parse(text) as ReprioritizationOutput;
    } catch (err) {
      console.error("Error in reprioritizeTasks, invoking fallback:", err);
      return this.getFallbackReprioritization(selectedTask, taskList);
    }
  },

  // -------------------------------------------------------------------------
  // GRACEFUL FAILBACK METHODS (Mocking operational results if no API key)
  // -------------------------------------------------------------------------

  getFallbackRiskAssessment(
    task: { title: string; estimatedMinutes: number; priority: string; deadline: string | Date },
    currentTime: string
  ): RiskAssessmentOutput {
    const deadlineMs = new Date(task.deadline).getTime();
    const currentMs = new Date(currentTime).getTime();
    const minutesLeft = Math.max(0, Math.floor((deadlineMs - currentMs) / (1000 * 60)));

    let riskScore = 30;
    if (task.priority === "critical") riskScore += 30;
    if (task.priority === "high") riskScore += 15;
    
    // Time factor
    if (minutesLeft < task.estimatedMinutes) {
      riskScore += 40;
    } else if (minutesLeft < task.estimatedMinutes * 2) {
      riskScore += 20;
    }

    riskScore = Math.min(100, Math.max(0, riskScore));
    const riskLevel = riskScore > 75 ? "critical" : riskScore > 35 ? "watch" : "safe";
    const recommendedMode = riskLevel === "critical" ? "compress" : riskLevel === "watch" ? "rescue" : "maintain";

    return {
      riskScore,
      riskLevel,
      riskReasonSummary: `Calculated failure risk is ${riskScore}%. Time remaining is ${Math.ceil(minutesLeft / 60)}h vs estimated workload of ${(task.estimatedMinutes / 60).toFixed(1)}h.`,
      topRiskFactors: [
        `High workload density for available ${Math.ceil(minutesLeft / 60)} hours.`,
        task.priority === "critical" ? "Priority class is critical." : "Task is marked high risk.",
        "Buffer window contains zero redundant slots."
      ],
      recommendedMode
    };
  },

  getFallbackRescuePlan(task: { title: string; category: string; estimatedMinutes: number }): RescuePlanOutput {
    const partTime = Math.ceil(task.estimatedMinutes / 3);
    return {
      planTitle: `Tactical Delivery Plan: ${task.title}`,
      planSummary: "Focused step-by-step path isolating key functional requirements for immediate deployment.",
      steps: [
        {
          stepId: "step_1",
          title: "Isolate Core Deliverables",
          description: `Analyze requirements for ${task.title}. Eliminate any non-essential telemetry or logging parameters.`,
          estimatedMinutes: Math.ceil(partTime * 0.8),
          urgencyTag: "now",
          completionType: "manual"
        },
        {
          stepId: "step_2",
          title: `Build ${task.category} Interface`,
          description: "Implement direct, secure functional components with local state managers.",
          estimatedMinutes: partTime,
          urgencyTag: "soon",
          completionType: "review"
        },
        {
          stepId: "step_3",
          title: "Verify Firebase Integrations",
          description: "Perform schema validation checks and deploy write transactions under active security rules.",
          estimatedMinutes: Math.ceil(partTime * 1.2),
          urgencyTag: "later",
          completionType: "submit"
        }
      ],
      totalEstimatedMinutes: task.estimatedMinutes,
      firstActionLabel: `Initiate ${task.title} Rescue`
    };
  },

  getFallbackPlanCompression(originalPlan: RescuePlanOutput): PlanCompressionOutput {
    // Keep only step 1 and 3, reduce times by half
    const compressedSteps: RescueStep[] = originalPlan.steps
      .filter((_, idx) => idx % 2 === 0)
      .map((step) => ({
        ...step,
        estimatedMinutes: Math.max(15, Math.ceil(step.estimatedMinutes * 0.5)),
        urgencyTag: "now"
      }));

    const totalMinutes = compressedSteps.reduce((acc, s) => acc + s.estimatedMinutes, 0);

    return {
      compressionMode: "hard",
      compressedSummary: `Brutally reduced plan steps from ${originalPlan.steps.length} to ${compressedSteps.length}. Effort compressed to ${totalMinutes} minutes to safeguard deadline.`,
      compressedSteps,
      droppedOrDeferred: [
        "Dropped secondary unit test suites and comprehensive coverage verification.",
        "Deferred styling embellishments and smooth animations to next deployment loop.",
        "Excluded optional logging hooks and telemetry indicators."
      ],
      survivalGoal: "Guarantee a functional, secure database write pipeline before deadline expiry."
    };
  },

  getFallbackReprioritization(
    selectedTask: { taskId: string; title: string },
    taskList: Array<{ taskId: string; title: string; priority: string }>
  ): ReprioritizationOutput {
    // Put selected task at the top
    const otherTasks = taskList.filter((t) => t.taskId !== selectedTask.taskId);
    const sorted = [selectedTask.taskId, ...otherTasks.map((t) => t.taskId)];

    return {
      prioritizedTaskIds: sorted,
      explanation: `Reprioritized workspace context. Deployed immediate rescue focus on task: "${selectedTask.title}". All other tasks have been deferred to ensure adequate delivery bandwidth.`,
      immediateFocusTaskId: selectedTask.taskId,
      deferredTaskIds: otherTasks.map((t) => t.taskId)
    };
  }
};
