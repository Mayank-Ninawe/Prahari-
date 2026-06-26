import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";
import { TaskDocument, RescuePlanDocument } from "./firebaseService";

export interface DemoScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  task: Omit<TaskDocument, "taskId" | "createdAt" | "updatedAt">;
  plan: Omit<RescuePlanDocument, "planId" | "createdAt" | "updatedAt">;
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

export const DemoService = {
  getScenarios(): DemoScenario[] {
    const now = new Date();
    
    // Scenario 1: Compiler Project (Critical stand-by rescue path)
    const compilerDeadline = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
    
    // Scenario 2: Pitch Deck (Scope compression recommended)
    const pitchDeadline = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes from now
    
    // Scenario 3: Final Hackathon Submission (Active rescue plan)
    const hackathonDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    return [
      {
        id: "scenario_compiler_project",
        name: "SaaS Compiler Project Due",
        badge: "Critical Standby",
        description: "6 hours left. Multi-phase assignment is incomplete. Deep crisis, risk level critical, rescue path waiting.",
        task: {
          title: "CS301 Multi-Pass Compiler Project",
          description: "Implement lexical analyzer, syntax parser, AST generation, and intermediate code generation. Major grade impact.",
          category: "Academic",
          deadline: Timestamp.fromDate(compilerDeadline),
          estimatedMinutes: 240,
          priority: "critical",
          status: "rescue_ready",
          riskScore: 94,
          riskLevel: "critical",
          riskReasonSummary: "Severe time compression. Required duration exceeds the available safety margin. High code complexity without baseline regression tests.",
          aiLastEvaluatedAt: Timestamp.fromDate(now),
          selectedPlanId: "plan_compiler_project",
          nextActionLabel: "Activate Tactical Rescue Path",
          countdownStart: null,
          source: "user",
          progressPercentage: 0,
          completedStepsCount: 0,
          totalStepsCount: 4
        },
        plan: {
          planTitle: "Compiler Project Deadline Recovery Plan",
          planSummary: "Tactical execution prioritizing the core parser loop, skipping non-essential optimization passes to salvage core execution marks.",
          steps: [
            {
              stepId: "step_compiler_1",
              title: "Write Parser Rules with ANTLR / JFlex",
              description: "Generate compiler parser files from lexer grammar. Run diagnostic scripts on base test suites.",
              estimatedMinutes: 60,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_compiler_2",
              title: "AST Generation Nodes & Tree Traversal",
              description: "Construct correct Abstract Syntax Tree nodes for primitive expressions and conditional branches.",
              estimatedMinutes: 80,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_compiler_3",
              title: "Basic Semantic Type Checker",
              description: "Confirm scope validation, variables declaration lookup, and primitive types matching rules function.",
              estimatedMinutes: 50,
              urgencyTag: "soon",
              completionType: "review"
            },
            {
              stepId: "step_compiler_4",
              title: "Build and Submit Packaging Bundle",
              description: "Zip compiler sources, generate simple README usage command lines, verify build-test executes cleanly.",
              estimatedMinutes: 50,
              urgencyTag: "later",
              completionType: "submit"
            }
          ],
          totalEstimatedMinutes: 240,
          firstActionLabel: "Start Parser Rules",
          compressionMode: "not_needed",
          survivalGoal: "Achieve functional syntax validation and AST generation. Relinquish type-coercion compiler optimizers for next step.",
          completedStepIds: [],
          progressPercentage: 0,
          source: "system"
        }
      },
      {
        id: "scenario_pitch_deck",
        name: "SaaS Product Pitch Slides",
        badge: "Compression Advised",
        description: "45 minutes left. 5 steps pending but estimated time exceeds remaining time. Scope reduction requested.",
        task: {
          title: "SaaS Product Pitch Slides & Demo Prep",
          description: "Prepare presentation deck, review slides with cofounders, record fallback demo video, and submit deck to pitch portal.",
          category: "Business",
          deadline: Timestamp.fromDate(pitchDeadline),
          estimatedMinutes: 60,
          priority: "high",
          status: "in_progress",
          riskScore: 82,
          riskLevel: "high",
          riskReasonSummary: "Absolute deadline limit within 45 mins. 5 separate actions remaining. Estimated manual time exceeds available window.",
          aiLastEvaluatedAt: Timestamp.fromDate(now),
          selectedPlanId: "plan_pitch_deck",
          nextActionLabel: "Execute Scope Compression",
          countdownStart: Timestamp.fromDate(now),
          source: "user",
          progressPercentage: 20,
          completedStepsCount: 1,
          totalStepsCount: 5
        },
        plan: {
          planTitle: "SaaS Pitch Rescue Plan",
          planSummary: "High pressure compression plan. Deferring mock branding polish and video rendering to secure slide deck export and link upload.",
          steps: [
            {
              stepId: "step_pitch_1",
              title: "Polish Value Proposition & Market Slide",
              description: "Finalize TAM/SAM numbers and clean up competitors alignment diagram.",
              estimatedMinutes: 10,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_pitch_2",
              title: "Draft Live Demo Interactive Flow Script",
              description: "Define the exact click paths to avoid delays during screenshare mode.",
              estimatedMinutes: 15,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_pitch_3",
              title: "Record Backup Video Screenshare Segment",
              description: "Quick 2-minute raw recording in case demo platform fails.",
              estimatedMinutes: 15,
              urgencyTag: "soon",
              completionType: "review"
            },
            {
              stepId: "step_pitch_4",
              title: "Upload Presentation to Pitch Portal",
              description: "Submit final PPTX/PDF file to system portal and check public link shares.",
              estimatedMinutes: 10,
              urgencyTag: "later",
              completionType: "submit"
            }
          ],
          totalEstimatedMinutes: 50,
          firstActionLabel: "Refine Slides",
          compressionMode: "light",
          compressedSteps: [
            {
              stepId: "step_pitch_1",
              title: "Write Quick Slides Script (Pruned)",
              description: "Prune presentation from 12 slides down to 5 critical impact screens.",
              estimatedMinutes: 5,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_pitch_2",
              title: "Mock Live Interactive Flow (Pruned)",
              description: "Skip live server setup. Use local localhost dev environment mock endpoints.",
              estimatedMinutes: 5,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_pitch_4",
              title: "Direct Deck PDF Export (Pruned)",
              description: "Export current slide deck to PDF directly and upload in-progress copy.",
              estimatedMinutes: 5,
              urgencyTag: "later",
              completionType: "submit"
            }
          ],
          droppedOrDeferred: ["Record Backup Video Screenshare Segment (Saved 15 minutes)"],
          survivalGoal: "Submit a crisp 5-page PDF deck and execute mock live flow directly from local system. Save 35 minutes total.",
          completedStepIds: ["step_pitch_1"],
          progressPercentage: 20,
          source: "system"
        }
      },
      {
        id: "scenario_hackathon_submission",
        name: "Prahari AI Final Pitch Ready",
        badge: "Active Rescue Mode",
        description: "2 hours left. Plan is activated, progress is active, focus shields are tracking, countdown running.",
        task: {
          title: "Prahari AI Final Submission & Demo Video",
          description: "Submit code to Github repository, record high-quality 2-minute demo video walkthrough, and configure Devpost submission form.",
          category: "Engineering",
          deadline: Timestamp.fromDate(hackathonDeadline),
          estimatedMinutes: 90,
          priority: "high",
          status: "in_progress",
          riskScore: 68,
          riskLevel: "medium",
          riskReasonSummary: "Underactive milestone status. Remaining timeline is sufficient if focus shields are held. Low margin for technical recording issues.",
          aiLastEvaluatedAt: Timestamp.fromDate(now),
          selectedPlanId: "plan_hackathon_submission",
          nextActionLabel: "Start Active Steps",
          countdownStart: Timestamp.fromDate(now),
          source: "user",
          progressPercentage: 50,
          completedStepsCount: 2,
          totalStepsCount: 4
        },
        plan: {
          planTitle: "Prahari AI Hackathon Submission Rescue Track",
          planSummary: "High value action track. Eliminating secondary documentation pages to ensure dev server and linter run beautifully, and walkthrough details key innovations.",
          steps: [
            {
              stepId: "step_hackathon_1",
              title: "Deploy Firebase Rules and Run Linters",
              description: "Verify Firestore indexes are built, run npm build script, verify static site assets render smoothly.",
              estimatedMinutes: 15,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_hackathon_2",
              title: "Draft Devpost Submission Copy",
              description: "Detail design decisions, problem statement, core value modules, and technical features description.",
              estimatedMinutes: 20,
              urgencyTag: "now",
              completionType: "manual"
            },
            {
              stepId: "step_hackathon_3",
              title: "Record Walkthrough Screen Video",
              description: "Record crisp 2-minute screenshare. Focus on showing real assessment, rescue planning, compression, and notifications.",
              estimatedMinutes: 35,
              urgencyTag: "soon",
              completionType: "review"
            },
            {
              stepId: "step_hackathon_4",
              title: "Submit Devpost Form and Repo Links",
              description: "Complete final Devpost submission questionnaire, add Github URL, add demo video link and click submit.",
              estimatedMinutes: 20,
              urgencyTag: "later",
              completionType: "submit"
            }
          ],
          totalEstimatedMinutes: 90,
          firstActionLabel: "Deploy and Build",
          compressionMode: "not_needed",
          survivalGoal: "Complete Devpost and video upload with verified build status. Do not risk overbuilding unneeded feature flags.",
          completedStepIds: ["step_hackathon_1", "step_hackathon_2"],
          progressPercentage: 50,
          source: "system"
        }
      }
    ];
  },

  /**
   * Clears all user tasks and plans, then seeds the 3 scenarios
   */
  async seedDemoWorkspace(uid: string): Promise<void> {
    if (!uid) return;

    try {
      let batch = writeBatch(db);
      let opCount = 0;

      const commitIfNeeded = async (force = false) => {
        if (opCount > 0 && (force || opCount >= 450)) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      };

      // 1. Delete all existing tasks & plans first to avoid pollution
      const tasksCol = collection(db, "users", uid, "tasks");
      const tasksSnap = await getDocs(tasksCol);
      for (const d of tasksSnap.docs) {
        // delete rescuePlans subcollection
        const plansCol = collection(db, "users", uid, "tasks", d.id, "rescuePlans");
        const plansSnap = await getDocs(plansCol);
        for (const p of plansSnap.docs) {
          batch.delete(doc(db, "users", uid, "tasks", d.id, "rescuePlans", p.id));
          opCount++;
          await commitIfNeeded();
        }
        batch.delete(doc(db, "users", uid, "tasks", d.id));
        opCount++;
        await commitIfNeeded();
      }

      // 2. Clear all existing notifications to match
      const notifsCol = collection(db, "users", uid, "notifications");
      const notifsSnap = await getDocs(notifsCol);
      for (const d of notifsSnap.docs) {
        batch.delete(doc(db, "users", uid, "notifications", d.id));
        opCount++;
        await commitIfNeeded();
      }

      // 3. Seed scenarios
      const scenarios = this.getScenarios();
      const localTasks: TaskDocument[] = [];

      for (const sc of scenarios) {
        const taskId = sc.id;
        const planId = sc.plan.selectedPlanId || sc.task.selectedPlanId || "demo_plan_id";

        const taskDoc: TaskDocument = {
          ...sc.task,
          taskId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const planDoc: RescuePlanDocument = {
          ...sc.plan,
          planId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        batch.set(doc(db, "users", uid, "tasks", taskId), taskDoc);
        opCount++;
        await commitIfNeeded();

        batch.set(doc(db, "users", uid, "tasks", taskId, "rescuePlans", planId), planDoc);
        opCount++;
        await commitIfNeeded();

        // Prepare local representation
        const localTask: TaskDocument = {
          ...sc.task,
          taskId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const localPlan: RescuePlanDocument = {
          ...sc.plan,
          planId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localTasks.push(localTask);
        if (typeof window !== "undefined") {
          localStorage.setItem(`prahari_plans_${uid}_${taskId}`, JSON.stringify([localPlan]));
        }
      }

      await commitIfNeeded(true);

      if (typeof window !== "undefined") {
        localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(localTasks));
        localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify([]));
      }
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - seeding Demo Workspace in localStorage");
        if (typeof window !== "undefined") {
          const scenarios = this.getScenarios();
          const localTasks: TaskDocument[] = [];
          for (const sc of scenarios) {
            const taskId = sc.id;
            const planId = sc.plan.selectedPlanId || sc.task.selectedPlanId || "demo_plan_id";
            const localTask: TaskDocument = {
              ...sc.task,
              taskId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            const localPlan: RescuePlanDocument = {
              ...sc.plan,
              planId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            localTasks.push(localTask);
            localStorage.setItem(`prahari_plans_${uid}_${taskId}`, JSON.stringify([localPlan]));
          }
          localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify(localTasks));
          localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify([]));
        }
        return;
      }
      throw error;
    }
  },

  /**
   * Resets workspace entirely to clean/empty state
   */
  async resetToEmptyWorkspace(uid: string): Promise<void> {
    if (!uid) return;

    try {
      let batch = writeBatch(db);
      let opCount = 0;

      const commitIfNeeded = async (force = false) => {
        if (opCount > 0 && (force || opCount >= 450)) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      };

      const tasksCol = collection(db, "users", uid, "tasks");
      const tasksSnap = await getDocs(tasksCol);
      for (const d of tasksSnap.docs) {
        const plansCol = collection(db, "users", uid, "tasks", d.id, "rescuePlans");
        const plansSnap = await getDocs(plansCol);
        for (const p of plansSnap.docs) {
          batch.delete(doc(db, "users", uid, "tasks", d.id, "rescuePlans", p.id));
          opCount++;
          await commitIfNeeded();
        }
        batch.delete(doc(db, "users", uid, "tasks", d.id));
        opCount++;
        await commitIfNeeded();
      }

      const notifsCol = collection(db, "users", uid, "notifications");
      const notifsSnap = await getDocs(notifsCol);
      for (const d of notifsSnap.docs) {
        batch.delete(doc(db, "users", uid, "notifications", d.id));
        opCount++;
        await commitIfNeeded();
      }

      await commitIfNeeded(true);

      if (typeof window !== "undefined") {
        localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify([]));
        localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify([]));
      }
    } catch (error) {
      if (isOfflineError(error)) {
        console.warn("Firestore offline - resetting Demo Workspace in localStorage");
        if (typeof window !== "undefined") {
          localStorage.setItem(`prahari_tasks_${uid}`, JSON.stringify([]));
          localStorage.setItem(`prahari_notifications_${uid}`, JSON.stringify([]));
        }
        return;
      }
      throw error;
    }
  }
};
