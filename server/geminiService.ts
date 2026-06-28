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

// ─── Circuit Breaker & Cooldown State ──────────────────────────────────────────

let consecutive503Failures = 0;
let circuitBreakerOpenUntil = 0;
const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

export function isCircuitBreakerOpen(): boolean {
  if (Date.now() < circuitBreakerOpenUntil) {
    return true;
  }
  return false;
}

function recordSuccess() {
  consecutive503Failures = 0;
  circuitBreakerOpenUntil = 0;
}

function recordFailure() {
  consecutive503Failures++;
  if (consecutive503Failures >= BREAKER_FAILURE_THRESHOLD) {
    circuitBreakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.warn(`[Circuit Breaker] OPENED. Cooldown in effect until ${new Date(circuitBreakerOpenUntil).toISOString()}`);
  }
}

export async function generateContentWithRetry(
  activeClient: GoogleGenAI,
  options: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3
): Promise<any> {
  if (isCircuitBreakerOpen()) {
    console.warn(`[Circuit Breaker] Request blocked because circuit breaker is open until ${new Date(circuitBreakerOpenUntil).toISOString()}`);
    throw new Error("503 UNAVAILABLE: Circuit Breaker Open (Temporary Cooldown in effect)");
  }

  let attempt = 0;
  while (true) {
    try {
      const result = await activeClient.models.generateContent(options);
      recordSuccess();
      return result;
    } catch (err: any) {
      attempt++;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini SDK] Attempt ${attempt} failed:`, errMsg);
      
      const isQuotaExceeded = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.toLowerCase().includes("quota") || err?.status === 429;
      const isUnavailable = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || err?.status === 503;
      
      if (isUnavailable || isQuotaExceeded) {
        recordFailure();
      }

      // If daily quota is exceeded, retry is futile. Fallback immediately. If unavailable, try once then fallback.
      const shouldFallbackNow = isQuotaExceeded || (isUnavailable && attempt >= 1) || attempt >= maxRetries;
      
      if (shouldFallbackNow) {
        if (options.model === "gemini-3.5-flash") {
          console.warn(`[Gemini SDK] gemini-3.5-flash failed (isQuota: ${isQuotaExceeded}, isUnavailable: ${isUnavailable}). Trying fallback model gemini-flash-latest...`);
          try {
            if (isCircuitBreakerOpen()) {
              throw new Error("503 UNAVAILABLE: Circuit Breaker Open (Temporary Cooldown in effect)");
            }
            const result = await activeClient.models.generateContent({
              ...options,
              model: "gemini-flash-latest"
            });
            recordSuccess();
            return result;
          } catch (fallbackErr: any) {
            const fallbackErrMsg = fallbackErr?.message || String(fallbackErr);
            console.error("[Gemini SDK] Fallback model gemini-flash-latest also failed, trying gemini-3.1-flash-lite...", fallbackErrMsg);
            if (fallbackErrMsg.includes("503") || fallbackErrMsg.includes("UNAVAILABLE") || fallbackErr?.status === 503) {
              recordFailure();
            }
            try {
              if (isCircuitBreakerOpen()) {
                throw new Error("503 UNAVAILABLE: Circuit Breaker Open (Temporary Cooldown in effect)");
              }
              const result = await activeClient.models.generateContent({
                ...options,
                model: "gemini-3.1-flash-lite"
              });
              recordSuccess();
              return result;
            } catch (fallbackErr2: any) {
              const fallbackErrMsg2 = fallbackErr2?.message || String(fallbackErr2);
              console.error("[Gemini SDK] Fallback model gemini-3.1-flash-lite also failed:", fallbackErrMsg2);
              if (fallbackErrMsg2.includes("503") || fallbackErrMsg2.includes("UNAVAILABLE") || fallbackErr2?.status === 503) {
                recordFailure();
              }
              throw err;
            }
          }
        }
        throw err;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 200; // jitter up to 200ms
      const delay = Math.min(10000, Math.pow(2, attempt) * 1000 + jitter);
      console.log(`[Gemini SDK] Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
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

export interface PlanningPhase {
  phaseId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  stepIds: string[];
}

export interface PlanningDependency {
  stepId: string;
  dependsOnIds: string[];
}

export interface PlanningBlocker {
  blockerId: string;
  description: string;
  type: "technical" | "resource" | "external";
  resolutionAction: string;
  affectStepIds: string[];
}

export interface RescueStep {
  stepId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  urgencyTag: "now" | "soon" | "later";
  completionType: "manual" | "review" | "submit";
  isEssential: boolean;
  phaseId: string;
}

export interface RescuePlanOutput {
  planId: string;
  planTitle: string;
  planSummary: string;
  planningMode: "autonomous" | "rescue" | "maintain";
  phases: PlanningPhase[];
  steps: RescueStep[];
  dependencies: PlanningDependency[];
  blockers: PlanningBlocker[];
  firstAction: {
    stepId: string;
    title: string;
    description: string;
    reason: string;
  };
  nextRecommendedStepId: string;
  minimumViablePath: string[];
  optionalPolishPath: string[];
  totalEstimatedMinutes: number;
  firstActionLabel: string;
  survivalGoal: string;
  droppedOrDeferred: string[];
  confidence: number;
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

// -------------------------------------------------------------------------
// REUSABLE SCHEMAS (using Type from @google/genai)
// -------------------------------------------------------------------------

const riskAssessmentSchema = {
  type: Type.OBJECT,
  properties: {
    riskScore: { type: Type.INTEGER, description: "Risk score from 0 to 100 based on urgency, remaining time, priority and complexity." },
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

const planningPhaseSchema = {
  type: Type.OBJECT,
  properties: {
    phaseId: { type: Type.STRING, description: "Unique ID for this phase, e.g., 'phase_1'." },
    title: { type: Type.STRING, description: "Title of the phase, e.g., 'Phase 1: Database Setup'." },
    description: { type: Type.STRING, description: "Detailed objective of this phase." },
    estimatedMinutes: { type: Type.INTEGER, description: "Estimated time to complete this phase in minutes." },
    stepIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of step IDs that belong to this phase, in sequential order."
    }
  },
  required: ["phaseId", "title", "description", "estimatedMinutes", "stepIds"]
};

const planningDependencySchema = {
  type: Type.OBJECT,
  properties: {
    stepId: { type: Type.STRING, description: "The step that has prerequisites/dependencies." },
    dependsOnIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step IDs that MUST be completed before this step can begin."
    }
  },
  required: ["stepId", "dependsOnIds"]
};

const planningBlockerSchema = {
  type: Type.OBJECT,
  properties: {
    blockerId: { type: Type.STRING, description: "Unique ID for this blocker, e.g., 'blocker_1'." },
    description: { type: Type.STRING, description: "Description of the potential blocker/critical bottleneck." },
    type: { type: Type.STRING, description: "Must be 'technical', 'resource', or 'external'." },
    resolutionAction: { type: Type.STRING, description: "The autonomous operational directive to resolve or bypass this blocker." },
    affectStepIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step IDs that will be blocked if this blocker triggers."
    }
  },
  required: ["blockerId", "description", "type", "resolutionAction", "affectStepIds"]
};

const rescueStepSchema = {
  type: Type.OBJECT,
  properties: {
    stepId: { type: Type.STRING, description: "Unique ID for the step, e.g., 'step_1', 'step_2'." },
    title: { type: Type.STRING, description: "Actionable, concrete title for this rescue step. Do not use generic text." },
    description: { type: Type.STRING, description: "Specific technical, administrative, or operational directive. Explain exactly how to verify this step." },
    estimatedMinutes: { type: Type.INTEGER, description: "Estimated time to complete this step in minutes." },
    urgencyTag: { type: Type.STRING, description: "Must be one of: 'now', 'soon', 'later'." },
    completionType: { type: Type.STRING, description: "Must be one of: 'manual', 'review', 'submit'." },
    isEssential: { type: Type.BOOLEAN, description: "True if this step is part of the Minimum Viable Path (mandatory work). False if it is optional polish or secondary scope." },
    phaseId: { type: Type.STRING, description: "The phase ID this step belongs to." }
  },
  required: ["stepId", "title", "description", "estimatedMinutes", "urgencyTag", "completionType", "isEssential", "phaseId"]
};

const rescuePlanSchema = {
  type: Type.OBJECT,
  properties: {
    planId: { type: Type.STRING, description: "Unique ID for this plan, e.g., 'plan_main'." },
    planTitle: { type: Type.STRING, description: "Operational rescue plan title, e.g., 'Core Interface Recovery Sequence'." },
    planSummary: { type: Type.STRING, description: "Overview of the recovery strategy focus under current constraints." },
    planningMode: { type: Type.STRING, description: "Must be 'autonomous'." },
    phases: {
      type: Type.ARRAY,
      items: planningPhaseSchema,
      description: "List of logical phases grouping the steps."
    },
    steps: {
      type: Type.ARRAY,
      items: rescueStepSchema,
      description: "Complete list of actionable steps needed to complete the task successfully, ordered logically."
    },
    dependencies: {
      type: Type.ARRAY,
      items: planningDependencySchema,
      description: "Inter-step dependency mappings."
    },
    blockers: {
      type: Type.ARRAY,
      items: planningBlockerSchema,
      description: "Identified critical bottlenecks or external constraints."
    },
    firstAction: {
      type: Type.OBJECT,
      properties: {
        stepId: { type: Type.STRING, description: "ID of the first actionable step." },
        title: { type: Type.STRING, description: "Title of the first actionable step." },
        description: { type: Type.STRING, description: "What needs to be done immediately." },
        reason: { type: Type.STRING, description: "Strategic justification why this step is first." }
      },
      required: ["stepId", "title", "description", "reason"]
    },
    nextRecommendedStepId: { type: Type.STRING, description: "ID of the next step recommended after the first action." },
    minimumViablePath: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ordered list of step IDs that constitute the Minimum Viable Path (essential steps only)."
    },
    optionalPolishPath: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ordered list of step IDs that represent nice-to-have or optional polish steps."
    },
    totalEstimatedMinutes: { type: Type.INTEGER, description: "Sum of estimatedMinutes of all steps." },
    firstActionLabel: { type: Type.STRING, description: "Concise action call to display on the button, e.g., 'Verify database security schema'." },
    survivalGoal: { type: Type.STRING, description: "The single ultimate survival goal representing the minimum viable functional subset to save the deadline." },
    droppedOrDeferred: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of nice-to-haves, polish, styles, or secondary features to cut or postpone to achieve the survivalGoal."
    },
    confidence: { type: Type.INTEGER, description: "Strategic confidence score from 0 to 100 of successfully meeting the deadline under this plan." }
  },
  required: [
    "planId",
    "planTitle",
    "planSummary",
    "planningMode",
    "phases",
    "steps",
    "dependencies",
    "blockers",
    "firstAction",
    "nextRecommendedStepId",
    "minimumViablePath",
    "optionalPolishPath",
    "totalEstimatedMinutes",
    "firstActionLabel",
    "survivalGoal",
    "droppedOrDeferred",
    "confidence"
  ]
};

const planCompressionSchema = {
  type: Type.OBJECT,
  properties: {
    compressionMode: { type: Type.STRING, description: "Must be one of: 'not_needed', 'light', 'hard'." },
    compressedSummary: { type: Type.STRING, description: "Summary explaining the compression strategy and what is prioritized." },
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

const recommendationItemSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "Unique recommendation ID, e.g., 'rec_1', 'rec_2'." },
    title: { type: Type.STRING, description: "Highly actionable title with specific details (not generic productivity slogans)." },
    description: { type: Type.STRING, description: "Deeply personalized guidance mentioning actual tasks, deadlines, and behavioral context." },
    urgency: { type: Type.STRING, description: "Must be 'critical', 'warning', or 'info'." },
    actionLabel: { type: Type.STRING, description: "The text to show on the action button (e.g., 'Start Compliance Rescue', 'Adjust Schedule')." },
    actionRoute: { type: Type.STRING, description: "Can be 'rescue', 'profile', 'dashboard', 'add_task'." },
    associatedTaskId: { type: Type.STRING, description: "The task ID this applies to, if any." },
    category: { type: Type.STRING, description: "The relevant category (e.g. Compliance, Backend, etc.) if any." },
    riskOfIgnoring: { type: Type.STRING, description: "High-pressure consequence if user ignores this specific warning." }
  },
  required: ["id", "title", "description", "urgency", "actionLabel", "actionRoute", "riskOfIgnoring"]
};

const personalizedRecommendationsSchema = {
  type: Type.OBJECT,
  properties: {
    detectedPattern: { type: Type.STRING, description: "Must be one of: 'OVERLOADED', 'DEADLINE_PRESSURE', 'PROCRASTINATING', 'CATEGORY_RISK', 'LAST_HOUR_WORKER', 'UNDERESTIMATING', 'STABLE'." },
    patternConfidence: { type: Type.INTEGER, description: "Confidence score from 0 to 100 based on signal strength." },
    patternAnalysis: { type: Type.STRING, description: "Concise analysis of the user's workload, past delays, and pressure density." },
    recommendations: {
      type: Type.ARRAY,
      items: recommendationItemSchema,
      description: "Ranked list of 2-4 personalized recommendations."
    }
  },
  required: ["detectedPattern", "patternConfidence", "patternAnalysis", "recommendations"]
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

      const response = await generateContentWithRetry(activeClient, {
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
        You are an elite autonomous execution planner and operational rescue system. Your role is to replace weak task planning with a high-fidelity, structured, phased, and dependency-aware operational plan.

        Current Timestamp: ${currentTime}
        Task Under Rescue:
        - Title: "${task.title}"
        - Description: "${task.description}"
        - Category: "${task.category}"
        - Deadline Target: "${deadlineStr}"
        - Estimated Effort Required: ${task.estimatedMinutes} minutes
        - High-Level Priority: "${task.priority}"
        
        Risk Context:
        - Risk Score: ${riskAssessment.riskScore}/100
        - Risk Level: "${riskAssessment.riskLevel}"
        - Root Causes: "${riskAssessment.riskReasonSummary}"

        User Work Preference:
        - Workspace Speed/Focus Style: "${userContext?.workStyle || "normal"}"

        INSTRUCTIONS:
        1. DECOMPOSE INTO PHASES: Break down the task into 2 to 3 logical phases (e.g., 'Phase 1: Setup & Prerequisite Verification', 'Phase 2: Core Logic Implementation', 'Phase 3: Validation & Polish').
        2. SEQUENCE CONCRETE STEPS: Generate a checklist of 3 to 6 steps. Each step must be associated with a phaseId and specify its title, detailed directive, estimated effort, urgencyTag ('now', 'soon', 'later'), and completionType ('manual', 'review', 'submit'). No generic fluff advice.
        3. CLASSIFY PATHS (MVP VS POLISH):
           - Mark each step's 'isEssential' boolean. Essential steps (true) form the Minimum Viable Path (MVP) required for basic safety. Optional or polish steps (false) form the Optional Polish Path.
           - Populate 'minimumViablePath' with ordered stepIds of essential steps.
           - Populate 'optionalPolishPath' with ordered stepIds of optional steps.
        4. DEPENDENCY MAPPING: Map prerequisites. Identify which stepIds depend on which other stepIds to form a strict execution sequence.
        5. BLOCKER IDENTIFICATION: Predict 1 or 2 critical bottlenecks (technical, resource, or external constraints). For each blocker, write a specific autonomous 'resolutionAction' outlining how the developer can resolve or bypass it immediately.
        6. DETECT FIRST ACTION: Identify the single most critical, high-leverage step that must be started first. Provide a precise strategic 'reason' explaining why this first action is mathematically and operationally optimal.
        7. ESTIMATE CONFIDENCE: Calculate an operational 'confidence' score (0 to 100) indicating the probability of successfully meeting the deadline given the remaining buffer time.
        8. PLANNING MODE: Always output planningMode as "autonomous".
      `;

      const response = await generateContentWithRetry(activeClient, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Lead Autonomous Task Planner for Prahari AI. Your role is to break down failing or complex tasks into a highly structured, phased, and dependency-mapped recovery sequence. Formulate a precise, structured JSON response according to the schema.",
          responseMimeType: "application/json",
          responseSchema: rescuePlanSchema,
          temperature: 0.25,
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
        You are a ruthless Plan Compression Engine of Prahari AI. Your mandate is to execute hard, extreme scope reduction to guarantee survival of a failing deadline.

        Task Context:
        - Title: "${task.title}"
        - Description: "${task.description}"
        - Category: "${task.category}"
        
        Remaining Available Time Window: "${remainingTimeContext}"
        Current Plan Effort Target: ${originalPlan.totalEstimatedMinutes} minutes.
        Compression Aggressiveness: "${userContext?.aggressiveness || "medium"}"

        Original Plan Steps to Compress:
        ${JSON.stringify(originalPlan.steps, null, 2)}

        CRITICAL PATH COMPRESSION DIRECTIVES:
        1. COMPRESS total estimated effort of steps by at least 40% to 60%.
        2. SIMPLIFY or merge steps. Focus ONLY on core technical deliverables (e.g., direct DB writes, simple UI inputs) and eliminate optional parameters, beautiful styles, advanced integrations, and extra validation.
        3. CHOOSE SURVIVAL GOAL: Identify the absolute minimum acceptable outcome (Minimum Viable Target) that ensures submission success.
        4. SPECIFY CUTS: Identify exactly what is being cut/postponed into the "droppedOrDeferred" array in highly specific terms.
        5. ELIMINATE ALL MOTIVATIONAL ADVICE. Give cold, clinical, high-efficiency engineering steps.
      `;

      const response = await generateContentWithRetry(activeClient, {
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

      const response = await generateContentWithRetry(activeClient, {
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
    const step1Id = "step_1";
    const step2Id = "step_2";
    const step3Id = "step_3";

    return {
      planId: "fallback_plan_" + Math.random().toString(36).substring(2, 9),
      planTitle: `Tactical Delivery Plan: ${task.title}`,
      planSummary: "Focused step-by-step path isolating key functional requirements for immediate deployment.",
      planningMode: "autonomous",
      phases: [
        {
          phaseId: "phase_1",
          title: "Phase 1: Setup & Core Isolation",
          description: "Deconstruct requirements, isolate core features, and clear potential blockers.",
          estimatedMinutes: Math.ceil(partTime * 0.8),
          stepIds: [step1Id]
        },
        {
          phaseId: "phase_2",
          title: "Phase 2: Functional Core Construction",
          description: "Build the main interactive layouts and core services under high velocity.",
          estimatedMinutes: partTime,
          stepIds: [step2Id, step3Id]
        }
      ],
      steps: [
        {
          stepId: step1Id,
          title: "Isolate Core Deliverables",
          description: `Analyze requirements for ${task.title}. Eliminate any non-essential telemetry or logging parameters.`,
          estimatedMinutes: Math.ceil(partTime * 0.8),
          urgencyTag: "now",
          completionType: "manual",
          isEssential: true,
          phaseId: "phase_1"
        },
        {
          stepId: step2Id,
          title: `Build ${task.category} Interface`,
          description: "Implement direct, secure functional components with local state managers.",
          estimatedMinutes: partTime,
          urgencyTag: "soon",
          completionType: "review",
          isEssential: true,
          phaseId: "phase_2"
        },
        {
          stepId: step3Id,
          title: "Verify Firebase Integrations",
          description: "Perform schema validation checks and deploy write transactions under active security rules.",
          estimatedMinutes: Math.ceil(partTime * 1.2),
          urgencyTag: "later",
          completionType: "submit",
          isEssential: false,
          phaseId: "phase_2"
        }
      ],
      dependencies: [
        { stepId: step2Id, dependsOnIds: [step1Id] },
        { stepId: step3Id, dependsOnIds: [step2Id] }
      ],
      blockers: [
        {
          blockerId: "blocker_1",
          description: "Integration API keys or Firebase connection latency.",
          type: "technical",
          resolutionAction: "Engage local storage mocks and standard offline write queues.",
          affectStepIds: [step3Id]
        }
      ],
      firstAction: {
        stepId: step1Id,
        title: "Isolate Core Deliverables",
        description: `Analyze requirements for ${task.title}. Eliminate any non-essential telemetry or logging parameters.`,
        reason: "Prerequisite setup must be completed before interface code can be written."
      },
      nextRecommendedStepId: step2Id,
      minimumViablePath: [step1Id, step2Id],
      optionalPolishPath: [step3Id],
      totalEstimatedMinutes: task.estimatedMinutes,
      firstActionLabel: `Initiate ${task.title} Rescue`,
      survivalGoal: `Deliver a basic working implementation of ${task.title} focusing on core functional flows.`,
      droppedOrDeferred: [
        "Deferred custom UI styles, animations, and non-essential layout configurations.",
        "Postponed secondary analytics integration, comprehensive unit testing, and redundant backup logging.",
        "Trimmed optional utility scripts and developer instrumentation."
      ],
      confidence: 85
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
  },

  /**
   * Module 5: Personalized Recommendations Engine (AI Powered)
   * Evaluates the full workload, user history and behavior patterns to provide concrete, highly relevant guidelines.
   */
  async generatePersonalizedRecommendations(
    tasks: any[],
    currentTime: string = new Date().toISOString(),
    userContext?: { workStyle?: string; aggressiveness?: string },
    customKey?: string
  ): Promise<PersonalizedRecommendationOutput> {
    const signals = extractBehavioralSignals(tasks, currentTime);
    const activeClient = getAIClient(customKey);
    
    if (!activeClient) {
      console.log("[Recommendations Engine] No Gemini API key. Invoking high-precision deterministic local engine.");
      return this.getFallbackPersonalizedRecommendations(tasks, currentTime, signals);
    }

    try {
      const taskBriefs = tasks.map(t => ({
        taskId: t.taskId,
        title: t.title,
        category: t.category,
        deadline: t.deadline,
        estimatedMinutes: t.estimatedMinutes,
        status: t.status,
        priority: t.priority,
        progressPercentage: t.progressPercentage || 0,
        selectedPlanId: t.selectedPlanId || null,
        updatedAt: t.updatedAt
      }));

      const prompt = `
        As a ruthless senior AI product engineer and recommendations designer, analyze these actual user tasks and extracted behavioral signals.
        
        Current Time: ${currentTime}
        Extracted Behavioral Signals:
        - overdueCount: ${signals.overdueCount} (tasks past deadline)
        - urgentUnstartedCount: ${signals.urgentUnstartedCount} (tasks due within 24h but unstarted/0% progress)
        - nearDeadlineTotalEffort: ${signals.nearDeadlineTotalEffort.toFixed(1)} hours of work due within 48h
        - inactiveLongTaskCount: ${signals.inactiveLongTaskCount} (high-effort tasks stagnant for 3+ days)
        - totalEstimatedHoursRemaining: ${signals.totalEstimatedHoursRemaining.toFixed(1)} hours of incomplete work left
        - daysUntilNearestDeadline: ${signals.daysUntilNearestDeadline.toFixed(2)} days
        - rescuePlanActivations: ${signals.rescuePlanActivations} (tasks with active rescue plans)
        - categoryRiskMap: ${JSON.stringify(signals.categoryRiskMap)} (count of missed deadlines or overdues per category)

        Actual Task Inventory:
        ${JSON.stringify(taskBriefs, null, 2)}

        INSTRUCTIONS FOR DETECTED PATTERNS:
        Classify the user into exactly ONE of the following patterns:
        1. 'OVERLOADED': totalEstimatedHoursRemaining > 15 AND daysUntilNearestDeadline <= 2.
        2. 'DEADLINE_PRESSURE': overdueCount > 0 OR urgentUnstartedCount >= 2 OR daysUntilNearestDeadline <= 1.
        3. 'PROCRASTINATING': inactiveLongTaskCount >= 1 AND (overdueCount > 0 OR daysUntilNearestDeadline <= 3).
        4. 'CATEGORY_RISK': If any category in categoryRiskMap has >= 2 slips.
        5. 'LAST_HOUR_WORKER': If tasks have deadlines within 24h of their creation, or are frequently completed very close to deadline.
        6. 'UNDERESTIMATING': If active rescue plans show high delays or progress lags behind schedule.
        7. 'STABLE': None of the above apply.

        CONSTRAINTS:
        - NEVER output generic productivity tips ("break tasks into steps", "stay focused", "take breaks").
        - Each recommendation must address actual tasks from the list by name, specific category, or deadline.
        - Provide highly targeted actionRoute ("rescue", "profile", "dashboard", "add_task") and actionLabel.
        - You must specify a clear "riskOfIgnoring" for each recommendation, showing the user the real, high-pressure consequence of inaction.
        - Produce a ranked list of 2 to 4 recommendations. The first must be the most critical, urgent, and actionable.
      `;

      const response = await generateContentWithRetry(activeClient, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the ruthless, high-performance personalized recommendation engine of Prahari AI. You diagnose operational slips and compute high-fidelity corrective actions. Speak with objective, professional composure. Do not use filler or friendly pleasantries.",
          responseMimeType: "application/json",
          responseSchema: personalizedRecommendationsSchema,
          temperature: 0.1,
        },
      });

      const text = response.text?.trim() || "";
      const parsed = JSON.parse(text) as PersonalizedRecommendationOutput;
      
      // Clean and validate
      if (!parsed.recommendations || parsed.recommendations.length === 0) {
        return this.getFallbackPersonalizedRecommendations(tasks, currentTime, signals);
      }

      return parsed;
    } catch (err) {
      console.error("[Recommendations Engine] AI generation failed, falling back safely:", err);
      return this.getFallbackPersonalizedRecommendations(tasks, currentTime, signals);
    }
  },

  /**
   * High-precision local deterministic recommendation generator.
   * Runs locally with 100% reliability, using real behavioral signal formulas.
   */
  getFallbackPersonalizedRecommendations(
    tasks: any[],
    currentTime: string,
    providedSignals?: any
  ): PersonalizedRecommendationOutput {
    const signals = providedSignals || extractBehavioralSignals(tasks, currentTime);
    const incompleteTasks = tasks.filter(t => t.status !== "completed" && t.status !== "mitigated");
    
    // Sort incomplete tasks by urgency score
    const sortedIncomplete = [...incompleteTasks].sort((a, b) => {
      const aMs = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bMs = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aMs - bMs;
    });

    const primaryTask = sortedIncomplete[0];

    let pattern: "OVERLOADED" | "DEADLINE_PRESSURE" | "PROCRASTINATING" | "CATEGORY_RISK" | "LAST_HOUR_WORKER" | "UNDERESTIMATING" | "STABLE" = "STABLE";
    let confidence = 85;
    let analysis = "Your workload parameters and timeline buffers are within normal thresholds. Continue with execution.";
    const recs: PersonalizedRecommendation[] = [];

    // Pattern classification logic
    if (signals.totalEstimatedHoursRemaining > 15 && signals.daysUntilNearestDeadline <= 2) {
      pattern = "OVERLOADED";
      analysis = `Severely overloaded with ${signals.totalEstimatedHoursRemaining.toFixed(1)} hours of remaining estimated workload against a critical nearest deadline in ${signals.daysUntilNearestDeadline.toFixed(1)} days. Execution parameters exceed standard limits.`;
    } else if (signals.overdueCount > 0 || signals.urgentUnstartedCount >= 2 || signals.daysUntilNearestDeadline <= 1) {
      pattern = "DEADLINE_PRESSURE";
      analysis = `Severe deadline collision detected. You have ${signals.overdueCount} overdue tasks and ${signals.urgentUnstartedCount} unstarted tasks due immediately. Time buffers have fully evaporated.`;
    } else if (signals.inactiveLongTaskCount >= 1 && (signals.overdueCount > 0 || signals.daysUntilNearestDeadline <= 3)) {
      pattern = "PROCRASTINATING";
      analysis = `Task procrastination lock. You are holding ${signals.inactiveLongTaskCount} heavy-effort tasks (>= 2h) inactive for over 3 days, despite upcoming deadlines drawing near.`;
    } else {
      const riskCategories = Object.entries(signals.categoryRiskMap as Record<string, number>).filter(([_, count]) => count >= 2);
      if (riskCategories.length > 0) {
        pattern = "CATEGORY_RISK";
        analysis = `Category-specific slippage pattern detected. You have a recurrent failure to deliver deadlines in the '${riskCategories[0][0]}' category (frequency: ${riskCategories[0][1]} slips).`;
      } else if (signals.rescuePlanActivations > 0 && sortedIncomplete.some(t => t.selectedPlanId && (t.progressPercentage || 0) < 30)) {
        pattern = "UNDERESTIMATING";
        analysis = "Active Rescue Plans are failing to progress. Underestimating task friction has stalled your recovery metrics below 30%.";
      }
    }

    // Populate recommendations based on detected pattern
    if (pattern === "OVERLOADED") {
      recs.push({
        id: "rec_overload_1",
        title: "Brutal Scope Compression Sequence",
        description: `You have ${signals.totalEstimatedHoursRemaining.toFixed(1)} hours of work. Select your highest-risk task and compress its plan. Strip out non-essential styling or documentation to protect your delivery rate.`,
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
        return d > 0 && d < new Date(currentTime).getTime();
      });

      const targetOverdue = overdueTasks[0] || primaryTask;
      
      recs.push({
        id: "rec_pressure_1",
        title: `Execute Rescue Step for: "${targetOverdue.title}"`,
        description: `This task is overdue or due immediately. Do not try to complete the entire requirement. Go to the Rescue Page and execute the single, micro-step milestone designated for 'now'.`,
        urgency: "critical",
        actionLabel: "Open Tactical Rescue",
        actionRoute: "rescue",
        associatedTaskId: targetOverdue.taskId,
        category: targetOverdue.category,
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
        title: `De-block Heavy task: "${stagnantTask.title}"`,
        description: `This stagnant ${stagnantTask.category} task has been left untouched for over 3 days. Commit to a 15-minute diagnostic session immediately. Set up an AI Rescue Plan to crack the initial friction.`,
        urgency: "critical",
        actionLabel: "Generate Rescue Plan",
        actionRoute: "rescue",
        associatedTaskId: stagnantTask.taskId,
        category: stagnantTask.category,
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
      const riskCategory = Object.entries(signals.categoryRiskMap as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] || "Compliance";
      const catTasks = sortedIncomplete.filter(t => t.category === riskCategory);
      const targetCatTask = catTasks[0] || primaryTask;

      recs.push({
        id: "rec_cat_1",
        title: `Pre-empt Recurrent "${riskCategory}" Failure`,
        description: `Historically, you frequently miss deadlines in the '${riskCategory}' category (slipping frequency: ${signals.categoryRiskMap[riskCategory] || 2} slips). Start your next '${riskCategory}' task immediately with a 20% estimated buffer built-in.`,
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
        title: `Trigger Compression on: "${targetUnder.title}"`,
        description: "Your recovery metrics for this task are below 30%. Your initial time estimates were too optimistic. Trigger a plan compression to prune auxiliary steps.",
        urgency: "critical",
        actionLabel: "Compress Recovery Steps",
        actionRoute: "rescue",
        associatedTaskId: targetUnder.taskId,
        category: targetUnder.category,
        riskOfIgnoring: "Continuing with an optimistic timeline ensures deadline breach. Triage and scope pruning are required now."
      });
    } else {
      // Stable Pattern
      recs.push({
        id: "rec_stable_1",
        title: "Backlog Buffer Optimization",
        description: primaryTask 
          ? `Workload is healthy. Secure your stable parameters by reviewing '${primaryTask.title}' (due in ${signals.daysUntilNearestDeadline.toFixed(1)} days) and preparing its environment early.`
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
      patternConfidence: confidence,
      patternAnalysis: analysis,
      recommendations: recs.slice(0, 3)
    };
  }
};

/**
 * Helper behavioral extractor to calculate parameters.
 */
export function extractBehavioralSignals(
  tasks: any[],
  currentTime: string = new Date().toISOString()
) {
  const now = new Date(currentTime).getTime();
  
  let overdueCount = 0;
  let urgentUnstartedCount = 0;
  let nearDeadlineTotalEffort = 0;
  let inactiveLongTaskCount = 0;
  let totalEstimatedHoursRemaining = 0;
  let daysUntilNearestDeadline = 99;
  let rescuePlanActivations = 0;
  const categoryRiskMap: Record<string, number> = {};

  for (const task of tasks) {
    const isCompleted = task.status === "completed" || task.status === "mitigated";
    const deadlineMs = task.deadline ? new Date(task.deadline).getTime() : 0;
    
    // Support string/Timestamp/Date safely for updatedAt and createdAt
    let updatedAtMs = 0;
    if (task.updatedAt) {
      if (typeof task.updatedAt.toMillis === "function") {
        updatedAtMs = task.updatedAt.toMillis();
      } else {
        updatedAtMs = new Date(task.updatedAt).getTime();
      }
    }
    
    let createdAtMs = 0;
    if (task.createdAt) {
      if (typeof task.createdAt.toMillis === "function") {
        createdAtMs = task.createdAt.toMillis();
      } else {
        createdAtMs = new Date(task.createdAt).getTime();
      }
    }

    const estimatedHours = (task.estimatedMinutes || 0) / 60;
    const category = task.category || "Uncategorized";

    if (!isCompleted) {
      totalEstimatedHoursRemaining += estimatedHours;

      // Overdue
      if (deadlineMs > 0 && deadlineMs < now) {
        overdueCount++;
        categoryRiskMap[category] = (categoryRiskMap[category] || 0) + 1;
      }

      // Urgent & Unstarted (due < 24h, draft or progress <= 0)
      const hoursLeft = deadlineMs > 0 ? (deadlineMs - now) / (1000 * 60 * 60) : 999;
      if (hoursLeft > 0 && hoursLeft <= 24 && (task.status === "draft" || !task.progressPercentage)) {
        urgentUnstartedCount++;
      }

      // Effort due in 48h
      if (hoursLeft > 0 && hoursLeft <= 48) {
        nearDeadlineTotalEffort += estimatedHours;
      }

      // Days until nearest deadline
      if (hoursLeft > 0 && (hoursLeft / 24) < daysUntilNearestDeadline) {
        daysUntilNearestDeadline = hoursLeft / 24;
      }

      // Inactive long task (>2 hours effort, not updated in 3 days)
      const daysSinceUpdate = updatedAtMs > 0 ? (now - updatedAtMs) / (1000 * 60 * 60 * 24) : 0;
      if (estimatedHours >= 2 && daysSinceUpdate >= 3) {
        inactiveLongTaskCount++;
      }

      if (task.selectedPlanId) {
        rescuePlanActivations++;
      }
    } else {
      // Completed. Was it completed past deadline?
      if (deadlineMs > 0 && updatedAtMs > deadlineMs) {
        categoryRiskMap[category] = (categoryRiskMap[category] || 0) + 1;
      }
    }
  }

  return {
    overdueCount,
    urgentUnstartedCount,
    nearDeadlineTotalEffort,
    inactiveLongTaskCount,
    categoryRiskMap,
    totalEstimatedHoursRemaining,
    daysUntilNearestDeadline: daysUntilNearestDeadline === 99 ? 14 : daysUntilNearestDeadline,
    rescuePlanActivations
  };
}
