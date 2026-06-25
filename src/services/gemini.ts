/**
 * Prahari AI - Gemini Service Client-Side Proxy
 * Routes AI operations safely to our full-stack Express server endpoints.
 * Never calls Gemini directly from the browser, preventing API key exposure.
 */

// Structured response types for future phase integration
export interface AIRescuePlan {
  planName: string;
  originalDeadline: string;
  criticalPathSteps: {
    sequence: number;
    title: string;
    description: string;
    estimatedHours: number;
    urgencyWeight: number; // 1 to 10
  }[];
  scopeCompressionRatio: number; // Percentage scope reduced
  riskMitigationStrategy: string;
}

export interface AIRiskAssessment {
  overallRiskScore: number; // 0.0 to 1.0
  riskClassification: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: string[];
  recommendedImmediateAction: string;
}

/**
 * Prahari AI Service Proxy
 */
export const GeminiService = {
  /**
   * Assesses deadline risks given a user project payload.
   * Will fetch the structured assessment from our secure Node server proxy.
   */
  async assessProjectRisk(projectTitle: string, description: string, deadline: string): Promise<AIRiskAssessment> {
    try {
      const response = await fetch("/api/rescue/assess-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectTitle, description, deadline }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assess risk: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as AIRiskAssessment;
    } catch (err) {
      console.error("GeminiService.assessProjectRisk error (Workspace Stub Mode):", err);
      // Failover fallback for compile safety and smooth mock-ups
      return {
        overallRiskScore: 0.35,
        riskClassification: "MEDIUM",
        riskFactors: ["Incomplete milestone breakdown", "Workspace setup phase active"],
        recommendedImmediateAction: "Complete Phase 1 setup and bind Firestore endpoints."
      };
    }
  },

  /**
   * Generates a compressed, high-urgency rescue execution plan.
   */
  async generateRescuePlan(projectTitle: string, description: string, deadline: string): Promise<AIRescuePlan> {
    try {
      const response = await fetch("/api/rescue/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectTitle, description, deadline }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate rescue plan: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as AIRescuePlan;
    } catch (err) {
      console.error("GeminiService.generateRescuePlan error (Workspace Stub Mode):", err);
      return {
        planName: `${projectTitle} Rescue Strategy`,
        originalDeadline: deadline,
        criticalPathSteps: [
          {
            sequence: 1,
            title: "Setup Phase 1 Foundation",
            description: "Install all libraries, routers, layouts, and styles.",
            estimatedHours: 2,
            urgencyWeight: 10,
          },
          {
            sequence: 2,
            title: "Verify Workspace Routes",
            description: "Trigger cross-route checks across Landing, Dashboard, and Rescue shells.",
            estimatedHours: 1,
            urgencyWeight: 8,
          }
        ],
        scopeCompressionRatio: 30,
        riskMitigationStrategy: "Pre-empt failure states by verifying navigation flow early."
      };
    }
  }
};
