import { TaskDocument, RescuePlanDocument } from "./firebaseService";
import { BusySlot } from "./calendarService";

export interface ScheduledBlock {
  blockId: string;
  taskId: string;
  taskTitle: string;
  title: string; // Name of the work block or step
  startTime: string; // ISO String
  endTime: string; // ISO String
  durationMinutes: number;
  explanation: string;
  isRescueBlock?: boolean;
  calendarEventId?: string;
}

export const SchedulingService = {
  /**
   * Generates standard daytime working windows for the next N days.
   * Standard work hours: 9:00 AM to 6:00 PM (local time).
   */
  getWorkingWindows(startDate: Date, daysAhead: number = 7, startHour: number = 9, endHour: number = 18): { start: Date; end: Date }[] {
    const windows: { start: Date; end: Date }[] = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < daysAhead; i++) {
      const currentDay = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      const start = new Date(currentDay);
      start.setHours(startHour, 0, 0, 0);
      
      const end = new Date(currentDay);
      end.setHours(endHour, 0, 0, 0);
      
      windows.push({ start, end });
    }
    return windows;
  },

  /**
   * Finds the earliest available conflict-free time block of a given duration.
   * Considers:
   * 1. Calendar busy slots (from Google Calendar)
   * 2. Standard daylight working hours (9 AM - 6 PM)
   * 3. Already scheduled task blocks
   * 4. Urgent fallback (for rescue blocks, allows scheduling immediately even if outside work hours)
   */
  findNextAvailableSlot(params: {
    durationMinutes: number;
    startFrom: Date;
    deadline: Date;
    busySlots: BusySlot[];
    existingBlocks: { start: Date; end: Date }[];
    isRescue: boolean;
  }): { start: Date; end: Date; explanation: string } {
    const { durationMinutes, startFrom, deadline, busySlots, existingBlocks, isRescue } = params;
    
    // Parse busy slots into Date objects
    const parsedBusy = busySlots.map(slot => ({
      start: new Date(slot.start),
      end: new Date(slot.end)
    }));

    // Combine busy slots with already scheduled task blocks
    const allExclusions = [...parsedBusy, ...existingBlocks].sort((a, b) => a.start.getTime() - b.start.getTime());

    // If it's a critical rescue block and we are under extreme time pressure, we can schedule immediately
    if (isRescue) {
      let candidateStart = new Date(Math.max(Date.now(), startFrom.getTime() + 10 * 60 * 1000)); // Start in 10 mins
      
      // Look for first slot of durationMinutes that doesn't overlap with any exclusion
      while (true) {
        const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
        
        // Check overlap with exclusions
        const overlap = allExclusions.find(exc => {
          return candidateStart.getTime() < exc.end.getTime() && candidateEnd.getTime() > exc.start.getTime();
        });

        if (!overlap) {
          // Success! Slot found
          let explanation = `Immediate rescue block scheduled starting at ${candidateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. `;
          if (parsedBusy.length > 0) {
            explanation += `Bypassed ${parsedBusy.length} calendar events to secure your earliest focus window.`;
          } else {
            explanation += `Positioned as your primary focus block to address this high-urgency task immediately.`;
          }
          return { start: candidateStart, end: candidateEnd, explanation };
        } else {
          // Advance past the overlapping exclusion
          candidateStart = new Date(overlap.end.getTime() + 5 * 60 * 1000); // 5 min buffer after exclusion
        }
      }
    }

    // Normal scheduling: Must be within working hours (9 AM to 6 PM)
    const workingWindows = this.getWorkingWindows(startFrom, 10); // Check up to 10 days out
    
    for (const window of workingWindows) {
      let candidateStart = new Date(Math.max(window.start.getTime(), startFrom.getTime()));
      
      while (candidateStart.getTime() + durationMinutes * 60 * 1000 <= window.end.getTime()) {
        const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
        
        // Check overlap with exclusions
        const overlap = allExclusions.find(exc => {
          return candidateStart.getTime() < exc.end.getTime() && candidateEnd.getTime() > exc.start.getTime();
        });

        if (!overlap) {
          // Found a slot! Does it exceed the deadline?
          const exceedsDeadline = candidateEnd.getTime() > deadline.getTime();
          let explanation = "";
          
          const timeString = candidateStart.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + 
                             ` at ${candidateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          if (exceedsDeadline) {
            explanation = `Placed on ${timeString}. Note: This slot extends past your formal deadline due to dense calendar scheduling, requiring manual negotiation or scope compression.`;
          } else {
            explanation = `Scheduled for ${timeString}. This is your earliest uninterrupted morning/afternoon work hour, avoiding your existing meetings and commitments.`;
          }
          
          return { start: candidateStart, end: candidateEnd, explanation };
        } else {
          // Advance past the overlapping exclusion
          candidateStart = new Date(overlap.end.getTime() + 5 * 60 * 1000); // 5 min buffer
        }
      }
    }

    // fallback if no slot found within working windows: schedule starting tomorrow morning
    const fallbackStart = new Date(startFrom);
    fallbackStart.setDate(fallbackStart.getDate() + 1);
    fallbackStart.setHours(9, 0, 0, 0);
    const fallbackEnd = new Date(fallbackStart.getTime() + durationMinutes * 60 * 1000);
    
    return {
      start: fallbackStart,
      end: fallbackEnd,
      explanation: `Scheduled as a morning fallback block. Calendar density is extremely high; this represents the earliest standard working hour.`
    };
  },

  /**
   * Schedules a task by converting its estimated minutes into actionable work blocks.
   * If a task has an active rescue plan, it converts each remaining plan step into a separate block!
   * Otherwise, it splits the task's remaining estimatedMinutes into blocks of max 90 minutes.
   */
  suggestScheduleForTask(
    task: TaskDocument,
    busySlots: BusySlot[],
    existingBlocks: { start: Date; end: Date }[] = [],
    activePlan?: RescuePlanDocument | null
  ): ScheduledBlock[] {
    const scheduledBlocks: ScheduledBlock[] = [];
    const now = new Date();
    
    const deadlineDate = task.deadline instanceof Date 
      ? task.deadline 
      : (task.deadline && typeof (task.deadline as any).toDate === "function" 
          ? (task.deadline as any).toDate() 
          : new Date(task.deadline as any || Date.now() + 24 * 60 * 60 * 1000));

    // Determine blocks to schedule
    const blocksToCreate: { title: string; duration: number; isRescue: boolean }[] = [];
    const isCritical = task.priority.toLowerCase() === "critical";

    if (activePlan && activePlan.steps && activePlan.steps.length > 0) {
      // Use active rescue plan steps!
      // If the plan has compressed steps (which represent the compressed scope), use those
      const stepsToUse = activePlan.compressedSteps && activePlan.compressedSteps.length > 0
        ? activePlan.compressedSteps
        : activePlan.steps;

      // Filter out steps that are already completed
      const completedIds = activePlan.completedStepIds || [];
      const remainingSteps = stepsToUse.filter(step => !completedIds.includes(step.stepId));

      remainingSteps.forEach((step, index) => {
        blocksToCreate.push({
          title: `Rescue Step ${index + 1}: ${step.title}`,
          duration: step.estimatedMinutes || 30,
          isRescue: isCritical || step.urgencyTag === "now"
        });
      });
    } else {
      // No active plan: split total estimated minutes into blocks of max 90 minutes
      let remainingMinutes = task.estimatedMinutes || 60;
      let blockIndex = 1;
      
      while (remainingMinutes > 0) {
        const blockDuration = Math.min(90, remainingMinutes);
        blocksToCreate.push({
          title: `Focus Session ${blockIndex}: ${task.title}`,
          duration: blockDuration,
          isRescue: isCritical && blockIndex === 1 // first block of critical task gets immediate rescue treatment
        });
        remainingMinutes -= blockDuration;
        blockIndex++;
      }
    }

    // Temporary list of scheduled ranges to avoid scheduling blocks of the SAME task at the same time
    const runningExclusions = [...existingBlocks];

    let lastEnd = now;

    blocksToCreate.forEach((blockSpec, index) => {
      const result = this.findNextAvailableSlot({
        durationMinutes: blockSpec.duration,
        startFrom: lastEnd,
        deadline: deadlineDate,
        busySlots,
        existingBlocks: runningExclusions,
        isRescue: blockSpec.isRescue
      });

      const block: ScheduledBlock = {
        blockId: `${task.taskId}_block_${index}_${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.taskId,
        taskTitle: task.title,
        title: blockSpec.title,
        startTime: result.start.toISOString(),
        endTime: result.end.toISOString(),
        durationMinutes: blockSpec.duration,
        explanation: result.explanation,
        isRescueBlock: blockSpec.isRescue
      };

      scheduledBlocks.push(block);
      runningExclusions.push({ start: result.start, end: result.end });
      lastEnd = result.end; // Next block starts after this block ends
    });

    return scheduledBlocks;
  }
};
