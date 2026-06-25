import { TaskDocument, RescuePlanDocument } from "../services/firebaseService";

export const ExportHelper = {
  /**
   * Generates a beautifully formatted plain text / markdown rescue path report
   */
  generateRescuePathReport(task: TaskDocument, plan: RescuePlanDocument): string {
    const deadlineStr = task.deadline instanceof Date 
      ? task.deadline.toLocaleString() 
      : (task.deadline as any)?.toDate?.()?.toLocaleString() || new Date(task.deadline as any).toLocaleString();

    const stepsList = (plan.compressionMode !== "not_needed" && plan.compressedSteps && plan.compressedSteps.length > 0)
      ? plan.compressedSteps
      : plan.steps;

    const stepsFormatted = stepsList.map((step, idx) => {
      const isCompleted = plan.completedStepIds?.includes(step.stepId);
      const statusSymbol = isCompleted ? "[✓] COMPLETED" : "[ ] PENDING";
      return `${idx + 1}. ${statusSymbol} (${step.urgencyTag.toUpperCase()}) - ${step.title}
   - Estimated Duration: ${step.estimatedMinutes} mins
   - Task Details: ${step.description}
   - Action Type: ${step.completionType.toUpperCase()}`;
    }).join("\n\n");

    const droppedFormatted = plan.droppedOrDeferred && plan.droppedOrDeferred.length > 0
      ? plan.droppedOrDeferred.map(item => `   - DEFERRED: ${item}`).join("\n")
      : "   - No scope reductions active.";

    return `================================================================
 PRAHARI AI - TACTICAL RESCUE PATH & SURVIVAL PROTOCOL
================================================================
Generated: ${new Date().toLocaleString()}
Target ID: ${task.taskId}

1. WORKSPACE TARGET ASSESSMENT
----------------------------------------------------------------
Title:        ${task.title}
Category:     ${task.category}
Deadline:     ${deadlineStr}
Priority:     ${task.priority.toUpperCase()}
Status:       ${task.status.toUpperCase()}

2. CRITICAL HAZARD SUMMARY
----------------------------------------------------------------
Risk Score:   ${task.riskScore}/100
Risk Level:   ${task.riskLevel.toUpperCase()}
Reasoning:    ${task.riskReasonSummary || "Severe time pressure detected by Prahari AI Engine."}

3. ACTIVE RECOVERY PLAN SUMMARY
----------------------------------------------------------------
Plan Title:   ${plan.planTitle}
Summary:      ${plan.planSummary}
Goal:         ${plan.survivalGoal || "Survival execution - deliver baseline deliverables."}
Compression:  ${plan.compressionMode.toUpperCase()}
Duration:     ${plan.totalEstimatedMinutes} minutes total

4. MILESTONES & ACTIVE STEPS
----------------------------------------------------------------
${stepsFormatted}

5. DEFERRED SCOPE / TRADEOFFS
----------------------------------------------------------------
${droppedFormatted}

================================================================
             STAY CALM. FOCUS SHIELDS ARE ENGAGED.
================================================================
`;
  },

  /**
   * Helper to trigger a direct download of the plain text report as a file
   */
  downloadRescuePathFile(task: TaskDocument, plan: RescuePlanDocument): void {
    try {
      const content = this.generateRescuePathReport(task, plan);
      const safeTitle = task.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const filename = `prahari_rescue_path_${safeTitle}.txt`;
      
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download rescue report file:", err);
    }
  },

  /**
   * Copy plain text to the clipboard with fallback support
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn("Navigator clipboard failed. Retrying fallback:", err);
      }
    }

    // Fallback approach
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Fallback clipboard write failed:", err);
      return false;
    }
  }
};
