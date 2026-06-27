import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Layers,
  ShieldAlert,
  Zap,
  Play,
  Target,
  Check,
  Clock,
  Minimize2,
  Sliders,
  AlertTriangle,
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
  Copy,
  Download,
} from "lucide-react";
import { useAuth } from "@/components/ui/ProtectedRoute";
import {
  FirebaseService,
  TaskDocument,
  RescuePlanDocument,
} from "../../services/firebaseService";
import { GeminiService, Reprioritization } from "../../services/gemini";
import { Card, Badge, Button } from "../../components/ui/BaseComponents";
import { ExportHelper } from "../../utils/exportHelper";
import { LockedRoute } from "@/config/constants";

export function RescuePage() {
  const { firebaseUser, userDoc } = useAuth();
  const location = useLocation();

  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [rescuePlans, setRescuePlans] = useState<RescuePlanDocument[]>([]);
  const [activePlan, setActivePlan] = useState<RescuePlanDocument | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [reprioritizing, setReprioritizing] = useState<boolean>(false);
  const [reprioritizeResult, setReprioritizeResult] = useState<Reprioritization | null>(null);

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"steps" | "compression" | "priority">("steps");

  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(1500);
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusStepTitle, setFocusStepTitle] = useState<string>("");
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
        setTasks(fetchedTasks);

        const stateTaskId = location.state?.taskId;
        if (stateTaskId && fetchedTasks.some((t) => t.taskId === stateTaskId)) {
          setSelectedTaskId(stateTaskId);
        } else if (fetchedTasks.length > 0) {
          setSelectedTaskId(fetchedTasks[0].taskId);
        }
      } catch (err) {
        console.error("Error fetching tasks for rescue:", err);
        setError("We couldn’t load your rescue workspace right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [firebaseUser, location.state]);

  const selectedTask = tasks.find((t) => t.taskId === selectedTaskId);

  const isCompressed = activePlan && activePlan.compressionMode !== "not_needed";
  const displaySteps =
    isCompressed && activePlan?.compressedSteps
      ? activePlan.compressedSteps
      : activePlan?.steps || [];

  useEffect(() => {
    if (!firebaseUser || !selectedTaskId) return;
    const fetchPlans = async () => {
      try {
        setLoadingPlan(true);
        const plans = await FirebaseService.getRescuePlans(firebaseUser.uid, selectedTaskId);
        setRescuePlans(plans);

        if (plans.length > 0) {
          const currentSelectedPlanId = selectedTask?.selectedPlanId;
          const active = plans.find((p) => p.planId === currentSelectedPlanId) || plans[0];
          setActivePlan(active);

          const completedMap: Record<string, boolean> = {};
          if (active.completedStepIds) {
            active.completedStepIds.forEach((id) => {
              completedMap[id] = true;
            });
          }
          setCompletedSteps(completedMap);
        } else {
          setActivePlan(null);
          setCompletedSteps({});
        }

        setReprioritizeResult(null);
        setActiveTab("steps");
      } catch (err) {
        console.error("Error fetching rescue plans:", err);
      } finally {
        setLoadingPlan(false);
      }
    };
    fetchPlans();
  }, [firebaseUser, selectedTaskId, selectedTask?.selectedPlanId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (focusTimerRunning && focusTimerSeconds > 0) {
      interval = setInterval(() => {
        setFocusTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (focusTimerSeconds === 0) {
      setFocusTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusTimerRunning, focusTimerSeconds]);

  const formatFocusTimer = () => {
    const mins = Math.floor(focusTimerSeconds / 60);
    const secs = focusTimerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDeadlineDate = (deadlineVal: any) => {
    if (!deadlineVal) return "";
    try {
      if (deadlineVal instanceof Date) {
        return deadlineVal.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      if (typeof deadlineVal?.toDate === "function") {
        return deadlineVal.toDate().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return new Date(deadlineVal).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(deadlineVal);
    }
  };

  const getReadableStatus = (status?: string) => {
    if (!status) return "Not started";
    const map: Record<string, string> = {
      rescue_ready: "Plan ready",
      in_progress: "In progress",
      compressed: "Compressed",
      completed: "Completed",
      mitigated: "Stabilized",
    };
    return map[status] || status.replace(/_/g, " ");
  };

  const handleCopyRescueReport = async () => {
    if (!selectedTask || !activePlan) return;
    const text = ExportHelper.generateRescuePathReport(selectedTask, activePlan);
    const result = await ExportHelper.copyToClipboard(text);
    if (result) {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    }
  };

  const handleDownloadRescueReport = () => {
    if (!selectedTask || !activePlan) return;
    ExportHelper.downloadRescuePathFile(selectedTask, activePlan);
  };

  const handleGenerateRescuePlan = async () => {
    if (!firebaseUser || !selectedTask) return;
    try {
      setGeneratingPlan(true);
      setError("");

      const deadlineStr =
        selectedTask.deadline instanceof Date
          ? selectedTask.deadline.toISOString()
          : (selectedTask.deadline as any)?.toDate?.()?.toISOString() || String(selectedTask.deadline);

      const riskAssessment = {
        riskScore: selectedTask.riskScore || 50,
        riskLevel: (selectedTask.riskLevel || "watch") as any,
        riskReasonSummary: selectedTask.riskReasonSummary || "Rescue plan requested.",
        topRiskFactors: ["Deadline pressure", "Workload capacity constraint"],
        recommendedMode: (selectedTask.riskLevel === "critical" ? "compress" : "rescue") as any,
      };

      const newPlan = await GeminiService.generateRescuePlan(
        {
          title: selectedTask.title,
          description: selectedTask.description,
          category: selectedTask.category,
          deadline: deadlineStr,
          estimatedMinutes: selectedTask.estimatedMinutes,
          priority: selectedTask.priority,
        },
        riskAssessment,
        {
          workStyle: userDoc?.workStyle || "normal",
          aggressiveness: userDoc?.demoModeEnabled ? "high" : "medium",
        }
      );

      const planDoc: Partial<RescuePlanDocument> = {
        planTitle: newPlan.planTitle,
        planSummary: newPlan.planSummary,
        steps: newPlan.steps,
        totalEstimatedMinutes: newPlan.totalEstimatedMinutes,
        firstActionLabel: newPlan.firstActionLabel,
        compressionMode: "not_needed",
      };

      const planId = await FirebaseService.saveRescuePlan(
        firebaseUser.uid,
        selectedTask.taskId,
        planDoc
      );
      const savedPlan = {
        ...planDoc,
        planId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RescuePlanDocument;

      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        selectedPlanId: planId,
        status: "rescue_ready",
        nextActionLabel: newPlan.firstActionLabel,
        progressPercentage: 0,
        completedStepsCount: 0,
        totalStepsCount: newPlan.steps.length,
      });

      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      setActivePlan(savedPlan);
      setRescuePlans([savedPlan, ...rescuePlans]);
      setActiveTab("steps");
    } catch (err: any) {
      console.error("Failed to generate rescue plan:", err);
      setError("Plan generation failed. Please check your Gemini setup and try again.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleCompressRescuePlan = async (mode: "light" | "hard") => {
    if (!firebaseUser || !selectedTask || !activePlan) return;
    try {
      setCompressing(true);
      setError("");

      const deadlineStr =
        selectedTask.deadline instanceof Date
          ? selectedTask.deadline.toISOString()
          : (selectedTask.deadline as any)?.toDate?.()?.toISOString() || String(selectedTask.deadline);

      const compressionResult = await GeminiService.compressRescuePlan(
        {
          title: selectedTask.title,
          description: selectedTask.description,
          category: selectedTask.category,
          deadline: deadlineStr,
          estimatedMinutes: selectedTask.estimatedMinutes,
        },
        {
          planTitle: activePlan.planTitle,
          planSummary: activePlan.planSummary,
          steps: activePlan.steps,
          totalEstimatedMinutes: activePlan.totalEstimatedMinutes,
          firstActionLabel: activePlan.firstActionLabel,
        },
        `Compression is requested to ${mode} mode due to tight remaining time.`,
        {
          workStyle: userDoc?.workStyle || "normal",
          aggressiveness: mode === "hard" ? "high" : "medium",
        }
      );

      const updatedPlanDoc: Partial<RescuePlanDocument> = {
        planId: activePlan.planId,
        compressionMode: mode,
        compressedSteps: compressionResult.compressedSteps,
        droppedOrDeferred: compressionResult.droppedOrDeferred,
        survivalGoal: compressionResult.survivalGoal,
        planSummary: compressionResult.compressedSummary,
      };

      await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, updatedPlanDoc);

      const newCompressedSteps = compressionResult.compressedSteps || [];
      const totalSteps = newCompressedSteps.length;
      const completedStepIds = activePlan.completedStepIds || [];
      const completedStepsCount = completedStepIds.filter((id) =>
        newCompressedSteps.some((s) => s.stepId === id)
      ).length;
      const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        status: "compressed",
        totalStepsCount: totalSteps,
        completedStepsCount,
        progressPercentage,
        nextActionLabel:
          newCompressedSteps.find((s) => !completedStepIds.includes(s.stepId))?.title ||
          "Continue steps",
      });

      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      const completeUpdatedPlan = {
        ...activePlan,
        ...updatedPlanDoc,
        progressPercentage,
        updatedAt: new Date(),
      } as RescuePlanDocument;

      setActivePlan(completeUpdatedPlan);
      setRescuePlans((prev) =>
        prev.map((p) => (p.planId === activePlan.planId ? completeUpdatedPlan : p))
      );
      setActiveTab("compression");
    } catch (err) {
      console.error("Plan compression failed:", err);
      setError("Plan compression failed. Please try again.");
    } finally {
      setCompressing(false);
    }
  };

  const handleReprioritize = async () => {
    if (!firebaseUser || !selectedTask) return;
    try {
      setReprioritizing(true);
      setError("");

      const deadlineStr =
        selectedTask.deadline instanceof Date
          ? selectedTask.deadline.toISOString()
          : (selectedTask.deadline as any)?.toDate?.()?.toISOString() || String(selectedTask.deadline);

      const listPayload = tasks.map((t) => {
        const dStr =
          t.deadline instanceof Date
            ? t.deadline.toISOString()
            : (t.deadline as any)?.toDate?.()?.toISOString() || String(t.deadline);
        return {
          taskId: t.taskId,
          title: t.title,
          priority: t.priority,
          deadline: dStr,
          riskScore: t.riskScore,
        };
      });

      const reprioritization = await GeminiService.reprioritizeTasks(
        {
          taskId: selectedTask.taskId,
          title: selectedTask.title,
          priority: selectedTask.priority,
          deadline: deadlineStr,
        },
        listPayload
      );

      setReprioritizeResult(reprioritization);
      setActiveTab("priority");
    } catch (err) {
      console.error("Reprioritization failed:", err);
      setError("AI reprioritization failed. Please try again.");
    } finally {
      setReprioritizing(false);
    }
  };

  const handleStartFocusOnStep = async (title: string, durationMinutes: number) => {
    setFocusStepTitle(title);
    setFocusTimerSeconds(durationMinutes * 60);
    setIsFocusModeActive(true);
    setFocusTimerRunning(true);

    if (activePlan && selectedTask && selectedTask.selectedPlanId !== activePlan.planId) {
      await handleActivatePlan(activePlan);
    }
  };

  const handleActivatePlan = async (plan: RescuePlanDocument) => {
    if (!firebaseUser || !selectedTask) return;
    try {
      setLoadingPlan(true);
      setError("");

      const totalSteps = plan.steps?.length || 0;

      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        selectedPlanId: plan.planId,
        status: "in_progress",
        nextActionLabel: plan.steps?.[0]?.title || plan.firstActionLabel || "Complete first step",
        progressPercentage: 0,
        completedStepsCount: 0,
        totalStepsCount: totalSteps,
      });

      if (!plan.completedStepIds) {
        await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, {
          planId: plan.planId,
          completedStepIds: [],
          progressPercentage: 0,
        });
      }

      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      const plans = await FirebaseService.getRescuePlans(firebaseUser.uid, selectedTask.taskId);
      setRescuePlans(plans);
      const active = plans.find((p) => p.planId === plan.planId) || plans[0];
      setActivePlan(active);
      setCompletedSteps({});
      setActiveTab("steps");
    } catch (err) {
      console.error("Error activating plan:", err);
      setError("We couldn’t activate this rescue plan.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const toggleStepCompleted = async (stepId: string) => {
    if (!firebaseUser || !selectedTask || !activePlan) return;
    try {
      const isCurrentlyDone = !!completedSteps[stepId];
      let newCompletedIds = activePlan.completedStepIds || [];

      if (isCurrentlyDone) {
        newCompletedIds = newCompletedIds.filter((id) => id !== stepId);
      } else {
        if (!newCompletedIds.includes(stepId)) {
          newCompletedIds = [...newCompletedIds, stepId];
        }
      }

      const totalSteps = displaySteps.length;
      const completedStepsCount = newCompletedIds.filter((id) =>
        displaySteps.some((s) => s.stepId === id)
      ).length;
      const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

      setCompletedSteps((prev) => ({
        ...prev,
        [stepId]: !isCurrentlyDone,
      }));

      let taskStatus = "in_progress";
      if (activePlan.compressionMode && activePlan.compressionMode !== "not_needed") {
        taskStatus = "compressed";
      }
      if (completedStepsCount === totalSteps && totalSteps > 0) {
        taskStatus = "completed";
      }

      const updatedPlanData: Partial<RescuePlanDocument> = {
        planId: activePlan.planId,
        completedStepIds: newCompletedIds,
        progressPercentage,
      };
      await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, updatedPlanData);

      const nextPendingStep = displaySteps.find((s) => !newCompletedIds.includes(s.stepId));
      const nextActionLabel =
        completedStepsCount === totalSteps ? "Task completed" : nextPendingStep?.title || "Continue steps";

      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        selectedPlanId: activePlan.planId,
        status: taskStatus,
        nextActionLabel,
        progressPercentage,
        completedStepsCount,
        totalStepsCount: totalSteps,
      });

      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      setActivePlan((prev) => (prev ? { ...prev, ...updatedPlanData } : null));
    } catch (err) {
      console.error("Failed to toggle step completion:", err);
      setError("We couldn’t save your progress.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-[#d4d1ca] rounded-full"></div>
          <div className="absolute inset-0 border-2 border-[#01696f] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-[11px] text-[#7a7974] tracking-wide animate-pulse">
          Loading rescue workspace...
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div id="rescue-empty-state" className="max-w-xl mx-auto py-16 text-center space-y-6 font-sans">
        <div className="w-16 h-16 bg-[#f3f0ec] rounded-full flex items-center justify-center mx-auto text-[#7a7974] border border-[#28251d]/10">
          <Layers className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[#28251d]">No tasks to rescue yet</h3>
          <p className="text-sm text-[#7a7974] max-w-sm mx-auto leading-relaxed">
            Add a deadline from the dashboard first, then return here to generate a rescue plan.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link to={LockedRoute.DASHBOARD}>
            <Button
              size="sm"
              variant="primary"
              icon={<ArrowRight className="w-3.5 h-3.5 text-white" />}
            >
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="rescue-page-root" className="space-y-8 font-sans text-[#28251d] text-left animate-fade-in">
      {isFocusModeActive && selectedTask && (
        <div
          id="focus-mode-stage"
          className="fixed inset-0 bg-[#171614] text-[#f9f8f4] z-50 flex flex-col justify-between p-8 sm:p-16 animate-fade-in font-sans"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#4f98a3] text-[#171614] rounded-sm flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-[#f9f8f4]">
                  Focus mode
                </h2>
                <p className="text-[11px] text-white/55">{selectedTask.title}</p>
              </div>
            </div>

            <button
              id="exit-focus-shell-btn"
              onClick={() => {
                setIsFocusModeActive(false);
                setFocusTimerRunning(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/15 hover:border-white/35 hover:bg-white/5 text-white/80 hover:text-white rounded-sm text-xs transition-colors cursor-pointer bg-transparent"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit focus mode</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 max-w-5xl mx-auto w-full my-8">
            <div className="flex-1 space-y-6 w-full text-left">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#4f98a3]" />
                  Current step
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {focusStepTitle || selectedTask.title}
                </h3>
              </div>

              <p className="text-sm text-white/70 leading-relaxed max-w-xl bg-white/5 p-6 rounded-sm border border-white/10">
                {selectedTask.description ||
                  "Stay with this one step until the timer ends. Ignore the rest of the workload for now."}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-xs text-white/45">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-white/30" />
                  Category: {selectedTask.category}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/30" />
                  Total estimate: {selectedTask.estimatedMinutes} mins
                </span>
              </div>
            </div>

            <div className="w-80 flex flex-col items-center justify-center bg-black/20 border border-white/10 p-10 rounded-sm relative shadow-2xl">
              <div className="absolute top-4 left-4 text-[9px] tracking-widest text-white/35 uppercase font-medium">
                Active session
              </div>

              <div className="text-6xl font-mono text-white font-bold tracking-tight my-6 select-none">
                {formatFocusTimer()}
              </div>

              <div className="flex gap-4 w-full">
                <button
                  id="timer-toggle-btn"
                  onClick={() => setFocusTimerRunning(!focusTimerRunning)}
                  className={`flex-1 py-2.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${
                    focusTimerRunning
                      ? "bg-[#a13544] hover:bg-[#782b33] text-white"
                      : "bg-white text-[#171614] hover:bg-[#e6e4df]"
                  }`}
                >
                  {focusTimerRunning ? "Pause" : "Start"}
                </button>
                <button
                  id="timer-reset-btn"
                  onClick={() => {
                    setFocusTimerSeconds(1500);
                    setFocusTimerRunning(false);
                  }}
                  className="px-4 py-2.5 bg-white/8 text-white/80 hover:bg-white/12 rounded-sm text-xs font-medium transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex items-center justify-between text-[11px] text-white/40 shrink-0">
            <span>Prahari AI active</span>
            <span>Stay on one task until the timer ends</span>
          </div>
        </div>
      )}

      <div
        id="rescue-header"
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#28251d]/10"
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-[#28251d] font-serif">
            Rescue workspace
          </h2>
          <p className="text-sm text-[#7a7974]">
            Review risk, generate a plan, compress scope if needed, and move through the next step.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="target-select" className="text-[11px] font-medium text-[#7a7974]">
            Task
          </label>
          <select
            id="target-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="px-3 py-2 text-sm text-[#28251d] bg-[#f9f8f5] border border-[#28251d]/12 rounded-sm focus:ring-0 focus:outline-none cursor-pointer"
          >
            {tasks.map((t) => (
              <option key={t.taskId} value={t.taskId}>
                {t.title} ({t.priority.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {selectedTask && (
        <div className="space-y-6">
          {(() => {
            const isStandby = selectedTask.status === "rescue_ready";
            const isCritical =
              selectedTask.riskLevel === "critical" || selectedTask.priority === "critical";

            const deadlineMillis =
              selectedTask.deadline instanceof Date
                ? selectedTask.deadline.getTime()
                : (selectedTask.deadline as any)?.toDate?.()?.getTime() ||
                  new Date(selectedTask.deadline as any).getTime();

            const nowMillis = Date.now();
            const remainingMinutes = Math.max(0, (deadlineMillis - nowMillis) / (1000 * 60));
            const isTimeOverdue =
              remainingMinutes > 0 && remainingMinutes < (selectedTask.estimatedMinutes || 60);
            const needsCompression = selectedTask.status === "in_progress" && isTimeOverdue;

            if (isStandby && activePlan) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                  <div className="flex gap-3 items-start sm:items-center text-left">
                    <span className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-amber-900">Your rescue plan is ready</h5>
                      <p className="text-amber-800 leading-normal">
                        Prahari has already prepared a recovery path for this task. Activate it to
                        start tracking progress.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleActivatePlan(activePlan)}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-sm font-medium transition-all cursor-pointer border-none"
                  >
                    Activate plan
                  </button>
                </div>
              );
            }

            if (needsCompression) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                  <div className="flex gap-3 items-start sm:items-center text-left">
                    <span className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-amber-900">You may not have enough time</h5>
                      <p className="text-amber-800 leading-normal">
                        Only about {Math.round(remainingMinutes)} minutes remain, which is less than
                        the estimated effort. Compress the plan to focus on the minimum viable path.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("compression")}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-sm font-medium transition-all cursor-pointer border-none"
                  >
                    Open compression
                  </button>
                </div>
              );
            }

            if (isCritical) {
              return (
                <div className="p-4 bg-rose-500/10 border border-rose-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                  <div className="flex gap-3 items-start sm:items-center text-left">
                    <span className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-semibold text-rose-900">This deadline is at serious risk</h5>
                      <p className="text-rose-800 leading-normal">
                        Start focus mode and move through the next step without distractions.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsFocusModeActive(true);
                      setFocusTimerRunning(true);
                    }}
                    className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-sm font-medium transition-all cursor-pointer border-none"
                  >
                    Start focus mode
                  </button>
                </div>
              );
            }

            return null;
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
            <div className="lg:col-span-5 space-y-6">
              <Card className="border border-[#28251d]/10 bg-[#f9f8f5] p-6 space-y-5">
                <div className="border-b border-[#28251d]/8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-sm bg-[#28251d] text-white flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#7a7974] block">Selected task</span>
                      <h3 className="text-base font-semibold text-[#28251d] mt-0.5">
                        {selectedTask.title}
                      </h3>
                    </div>
                  </div>
                  <Badge
                    urgency={
                      selectedTask.priority === "critical"
                        ? "critical"
                        : selectedTask.priority === "high"
                        ? "high"
                        : "low"
                    }
                  >
                    {selectedTask.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1 bg-white p-3 rounded-sm border border-[#28251d]/10">
                    <span className="text-[11px] text-[#7a7974] block">Category</span>
                    <p className="font-semibold text-[#28251d]">{selectedTask.category}</p>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-sm border border-[#28251d]/10">
                    <span className="text-[11px] text-[#7a7974] block">Status</span>
                    <p className="font-semibold text-[#28251d]">{getReadableStatus(selectedTask.status)}</p>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-sm border border-[#28251d]/10">
                    <span className="text-[11px] text-[#7a7974] block">Due date</span>
                    <p className="font-semibold text-rose-700">
                      {formatDeadlineDate(selectedTask.deadline)}
                    </p>
                  </div>

                  <div className="space-y-1 bg-white p-3 rounded-sm border border-[#28251d]/10">
                    <span className="text-[11px] text-[#7a7974] block">Estimated effort</span>
                    <p className="font-semibold text-[#28251d]">
                      {(selectedTask.estimatedMinutes / 60).toFixed(1)} hours
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-[#7a7974] leading-relaxed pt-2">
                  <span className="text-[11px] text-[#7a7974] block">Description</span>
                  <p className="bg-white p-3.5 border border-[#28251d]/10 rounded-sm text-[#28251d]">
                    {selectedTask.description || "No description provided."}
                  </p>
                </div>

                {selectedTask.riskReasonSummary && (
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-sm text-sm space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      AI risk review: {selectedTask.riskScore}%
                    </div>
                    <p className="text-[#28251d] leading-relaxed">{selectedTask.riskReasonSummary}</p>
                  </div>
                )}
              </Card>

              <Card className="border border-[#28251d]/10 bg-[#f3f0ec] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-[#28251d]">Actions</h3>

                <div className="space-y-2.5">
                  <button
                    onClick={handleGenerateRescuePlan}
                    disabled={generatingPlan}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#28251d] hover:bg-[#1d1c1a] text-white rounded-sm text-sm font-medium transition-all disabled:opacity-50 cursor-pointer border-none"
                  >
                    <Sparkles
                      className={`w-4.5 h-4.5 text-amber-400 ${generatingPlan ? "animate-spin" : ""}`}
                    />
                    {generatingPlan
                      ? "Generating plan..."
                      : activePlan
                      ? "Regenerate rescue plan"
                      : "Generate rescue plan"}
                  </button>

                  <button
                    onClick={handleReprioritize}
                    disabled={reprioritizing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#28251d]/12 hover:bg-[#f9f8f5] text-[#28251d] rounded-sm text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sliders
                      className={`w-4 h-4 text-[#7a7974] ${reprioritizing ? "animate-spin" : ""}`}
                    />
                    {reprioritizing ? "Reprioritizing..." : "Reprioritize tasks"}
                  </button>
                </div>

                <div className="pt-4 border-t border-[#28251d]/8 flex items-center justify-between text-[11px] text-[#7a7974]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Ready to generate and track
                  </span>
                  <span className="bg-white px-2 py-1 rounded-sm border border-[#28251d]/8">
                    Gemini + Firestore
                  </span>
                </div>
              </Card>

              {rescuePlans.length > 0 && (
                <Card className="border border-[#28251d]/10 bg-[#f9f8f5] p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#28251d]/8 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#28251d]">Saved plans</h3>
                      <p className="text-[11px] text-[#7a7974] mt-0.5">
                        Choose which plan should drive the current task.
                      </p>
                    </div>
                    <Database className="w-4 h-4 text-[#7a7974]" />
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {rescuePlans.map((plan) => {
                      const isActive = plan.planId === selectedTask.selectedPlanId;
                      const stepsCount = plan.steps?.length || 0;

                      return (
                        <div
                          key={plan.planId}
                          className={`p-3 rounded-sm border text-sm text-left transition-all ${
                            isActive
                              ? "border-emerald-300 bg-emerald-50/40"
                              : "border-[#28251d]/10 bg-white hover:bg-[#f9f8f5]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-[#28251d] leading-snug">
                              {plan.planTitle}
                            </div>
                            {isActive ? (
                              <span className="shrink-0 text-[10px] font-medium bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                Active
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] font-medium bg-[#e6e4df] text-[#7a7974] px-1.5 py-0.5 rounded-sm">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#7a7974] line-clamp-2 mt-1 leading-normal">
                            {plan.planSummary}
                          </p>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#28251d]/6 text-[11px] text-[#7a7974]">
                            <span>
                              {stepsCount} steps · {plan.totalEstimatedMinutes} mins
                            </span>
                            {isActive ? (
                              <span className="text-emerald-700 font-medium">
                                {plan.progressPercentage || 0}% done
                              </span>
                            ) : (
                              <button
                                onClick={() => handleActivatePlan(plan)}
                                className="px-2 py-1 border border-[#28251d]/12 hover:border-[#28251d]/35 bg-white hover:bg-[#f9f8f5] rounded-sm text-[#28251d] font-medium transition-all cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-7 space-y-6">
              {!activePlan && !generatingPlan ? (
                <Card className="border border-[#28251d]/10 bg-[#f9f8f5] p-12 text-center space-y-5 flex flex-col justify-center min-h-[400px]">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-base font-semibold text-[#28251d]">No rescue plan yet</h4>
                    <p className="text-sm text-[#7a7974] leading-normal">
                      Generate a plan to turn this task into a sequence of smaller, actionable steps.
                    </p>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleGenerateRescuePlan}
                      className="bg-[#28251d] hover:bg-[#1d1c1a] text-sm font-medium"
                      icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    >
                      Generate rescue plan
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex border border-[#28251d]/10 bg-[#f3f0ec] p-1 rounded-sm gap-1">
                    <button
                      onClick={() => setActiveTab("steps")}
                      className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all cursor-pointer ${
                        activeTab === "steps"
                          ? "bg-white text-[#28251d] border border-[#28251d]/10 shadow-sm"
                          : "text-[#7a7974] hover:text-[#28251d] hover:bg-[#f9f8f5]"
                      }`}
                    >
                      Checklist
                    </button>
                    <button
                      onClick={() => setActiveTab("compression")}
                      className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all cursor-pointer ${
                        activeTab === "compression"
                          ? "bg-white text-[#28251d] border border-[#28251d]/10 shadow-sm"
                          : "text-[#7a7974] hover:text-[#28251d] hover:bg-[#f9f8f5]"
                      }`}
                    >
                      Compression
                      {isCompressed && (
                        <span className="ml-2 text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded-sm">
                          Active
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab("priority")}
                      className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all cursor-pointer ${
                        activeTab === "priority"
                          ? "bg-white text-[#28251d] border border-[#28251d]/10 shadow-sm"
                          : "text-[#7a7974] hover:text-[#28251d] hover:bg-[#f9f8f5]"
                      }`}
                    >
                      Priorities
                    </button>
                  </div>

                  {activeTab === "steps" && activePlan && (
                    <Card className="border border-[#28251d]/10 bg-[#f9f8f5] p-6 space-y-6">
                      {selectedTask.selectedPlanId !== activePlan.planId && (
                        <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 text-left">
                            <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                              Rescue plan ready
                            </h5>
                            <p className="text-sm text-amber-800 leading-normal">
                              This plan has been generated successfully. Activate it to start progress
                              tracking.
                            </p>
                          </div>
                          <button
                            onClick={() => handleActivatePlan(activePlan)}
                            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-sm text-sm font-medium transition-all cursor-pointer border-none"
                          >
                            Activate plan
                          </button>
                        </div>
                      )}

                      <div className="border-b border-[#28251d]/8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-sm inline-block">
                            Plan connected
                          </span>
                          <h4 className="text-base font-semibold text-[#28251d] mt-1">
                            {activePlan.planTitle}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleCopyRescueReport}
                            className="px-2.5 py-1.5 border border-[#28251d]/10 hover:border-[#28251d]/30 bg-white hover:bg-[#f9f8f5] text-[#28251d] rounded-sm text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Copy report"
                          >
                            {copiedReport ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy report</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleDownloadRescueReport}
                            className="px-2.5 py-1.5 bg-[#28251d] hover:bg-[#1d1c1a] text-white rounded-sm text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border-none"
                            title="Download report"
                          >
                            <Download className="w-3 h-3 text-amber-400" />
                            <span>Download</span>
                          </button>

                          <div className="text-[11px] text-[#7a7974] bg-white px-2 py-1.5 rounded-sm border border-[#28251d]/8 shrink-0">
                            {activePlan.totalEstimatedMinutes} mins
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-[#7a7974] leading-relaxed italic bg-white p-3 border border-[#28251d]/10 rounded-sm">
                        “{activePlan.planSummary}”
                      </p>

                      <div className="space-y-3.5">
                        {displaySteps.map((step, idx) => {
                          const isDone = completedSteps[step.stepId];
                          return (
                            <div
                              key={step.stepId}
                              className={`p-4 border rounded-sm flex items-start gap-3.5 transition-all duration-200 ${
                                isDone
                                  ? "bg-[#f3f0ec] border-[#28251d]/8 opacity-60"
                                  : "bg-white border-[#28251d]/10 hover:border-[#28251d]/25"
                              }`}
                            >
                              <button onClick={() => toggleStepCompleted(step.stepId)} className="mt-1 cursor-pointer shrink-0">
                                <div
                                  className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${
                                    isDone
                                      ? "bg-[#28251d] border-[#28251d] text-white"
                                      : "border-[#28251d]/25 bg-white hover:border-[#28251d]"
                                  }`}
                                >
                                  {isDone && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </button>

                              <div className="flex-1 min-w-0 text-left space-y-1">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span className="text-[11px] text-[#7a7974] font-medium">
                                    Step {idx + 1}
                                  </span>
                                  <h5
                                    className={`text-sm font-semibold leading-tight ${
                                      isDone ? "text-[#7a7974] line-through" : "text-[#28251d]"
                                    }`}
                                  >
                                    {step.title}
                                  </h5>
                                  <Badge
                                    urgency={
                                      step.urgencyTag === "now"
                                        ? "critical"
                                        : step.urgencyTag === "soon"
                                        ? "medium"
                                        : "low"
                                    }
                                  >
                                    {step.urgencyTag}
                                  </Badge>
                                </div>

                                <p className="text-sm text-[#7a7974] leading-relaxed">
                                  {step.description}
                                </p>

                                <div className="pt-2 flex items-center justify-between text-[11px]">
                                  <span className="text-[#7a7974]">
                                    {step.estimatedMinutes} mins · {step.completionType}
                                  </span>
                                  {!isDone && (
                                    <button
                                      onClick={() =>
                                        handleStartFocusOnStep(step.title, step.estimatedMinutes)
                                      }
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-800 rounded-sm font-medium transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Play className="w-3 h-3 fill-amber-800" />
                                      Start focus
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {activeTab === "compression" && activePlan && (
                    <Card className="border border-[#28251d]/10 bg-[#f9f8f5] p-6 space-y-6 text-left">
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-[#28251d]">Plan compression</h4>
                        <p className="text-sm text-[#7a7974] leading-relaxed">
                          If the deadline is too close, reduce the plan to the minimum viable path.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-[#28251d]/10 rounded-sm p-4 space-y-3.5 bg-white">
                          <div className="space-y-1">
                            <span className="text-[11px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm inline-block">
                              Light compression
                            </span>
                            <h5 className="text-sm font-semibold text-[#28251d] mt-1">
                              Trim the plan
                            </h5>
                            <p className="text-sm text-[#7a7974] leading-relaxed">
                              Keep the main outcome intact, but defer optional polish and lower-value work.
                            </p>
                          </div>
                          <button
                            onClick={() => handleCompressRescuePlan("light")}
                            disabled={compressing}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 border-none"
                          >
                            {compressing ? "Compressing..." : "Apply light compression"}
                          </button>
                        </div>

                        <div className="border border-[#28251d]/10 rounded-sm p-4 space-y-3.5 bg-white">
                          <div className="space-y-1">
                            <span className="text-[11px] font-medium bg-rose-100 text-rose-900 px-2 py-0.5 rounded-sm inline-block">
                              Hard compression
                            </span>
                            <h5 className="text-sm font-semibold text-[#28251d] mt-1">
                              Survival mode
                            </h5>
                            <p className="text-sm text-[#7a7974] leading-relaxed">
                              Keep only what is necessary to finish and submit something viable on time.
                            </p>
                          </div>
                          <button
                            onClick={() => handleCompressRescuePlan("hard")}
                            disabled={compressing}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 border-none"
                          >
                            {compressing ? "Compressing..." : "Apply hard compression"}
                          </button>
                        </div>
                      </div>

                      {isCompressed && (
                        <div className="p-5 border border-amber-200 bg-amber-50/40 rounded-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                            <div className="flex items-center gap-1 text-sm font-semibold text-[#28251d]">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              Compression active ({activePlan.compressionMode?.toUpperCase()})
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  setCompressing(true);
                                  await FirebaseService.saveRescuePlan(firebaseUser!.uid, selectedTask.taskId, {
                                    planId: activePlan.planId,
                                    compressionMode: "not_needed",
                                  });
                                  const plans = await FirebaseService.getRescuePlans(
                                    firebaseUser!.uid,
                                    selectedTaskId
                                  );
                                  setRescuePlans(plans);
                                  if (plans.length > 0) setActivePlan(plans[0]);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setCompressing(false);
                                }
                              }}
                              className="text-[11px] font-medium text-rose-600 hover:text-rose-800 cursor-pointer bg-transparent border-none"
                            >
                              Reset
                            </button>
                          </div>

                          {activePlan.survivalGoal && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-medium text-amber-800 block">
                                Minimum viable outcome
                              </span>
                              <p className="text-sm text-[#28251d] font-medium leading-relaxed">
                                “{activePlan.survivalGoal}”
                              </p>
                            </div>
                          )}

                          {activePlan.droppedOrDeferred && activePlan.droppedOrDeferred.length > 0 && (
                            <div className="space-y-1 pt-1.5">
                              <span className="text-[11px] font-medium text-[#7a7974] block">
                                Deferred items
                              </span>
                              <ul className="text-sm text-[#7a7974] space-y-1 list-disc list-inside">
                                {activePlan.droppedOrDeferred.map((item, i) => (
                                  <li key={i} className="leading-relaxed">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  )}

                  {activeTab === "priority" && (
                    <Card className="border border-[#28251d]/10 bg-[#f9f8f5] p-6 space-y-6 text-left">
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-[#28251d]">Task priorities</h4>
                        <p className="text-sm text-[#7a7974] leading-relaxed">
                          Re-rank your workload so you know which task deserves immediate focus.
                        </p>
                      </div>

                      {!reprioritizeResult && !reprioritizing ? (
                        <div className="p-8 border border-[#28251d]/10 rounded-sm text-center space-y-4 bg-white">
                          <Sliders className="w-8 h-8 text-[#7a7974] mx-auto" />
                          <p className="text-sm text-[#7a7974] max-w-sm mx-auto leading-normal">
                            Analyze your current tasks and let Prahari suggest the order that best
                            protects your most urgent deadline.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReprioritize}
                            className="text-sm font-medium cursor-pointer"
                          >
                            Reprioritize now
                          </Button>
                        </div>
                      ) : reprioritizing ? (
                        <div className="p-12 text-center space-y-3">
                          <RefreshCw className="w-6 h-6 text-[#7a7974] animate-spin mx-auto" />
                          <p className="text-sm text-[#7a7974] animate-pulse">
                            Re-ranking your workload...
                          </p>
                        </div>
                      ) : (
                        reprioritizeResult && (
                          <div className="space-y-5">
                            <div className="p-4 bg-[#28251d] text-white rounded-sm space-y-1.5 relative overflow-hidden">
                              <div className="absolute top-2 right-2 text-[10px] text-white/35">
                                AI reasoning
                              </div>
                              <span className="text-[11px] tracking-wide text-amber-400 font-medium">
                                Why this order makes sense
                              </span>
                              <p className="text-sm text-white/75 leading-relaxed">
                                {reprioritizeResult.explanation}
                              </p>
                            </div>

                            <div className="space-y-2.5">
                              <span className="text-[11px] font-medium text-[#7a7974] block">
                                Suggested order
                              </span>
                              <div className="divide-y divide-[#28251d]/6 border border-[#28251d]/10 rounded-sm overflow-hidden bg-white">
                                {reprioritizeResult.prioritizedTaskIds.map((tid, index) => {
                                  const tDoc = tasks.find((t) => t.taskId === tid);
                                  if (!tDoc) return null;
                                  const isFocused = tid === reprioritizeResult.immediateFocusTaskId;

                                  return (
                                    <div
                                      key={tid}
                                      className={`p-3.5 flex items-center justify-between text-sm transition-colors ${
                                        isFocused ? "bg-amber-50/60 border-l-2 border-l-amber-500" : "bg-white"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium text-[#7a7974] w-4">
                                          {index + 1}
                                        </span>
                                        <div className="space-y-0.5">
                                          <p
                                            className={`font-semibold ${
                                              isFocused ? "text-amber-950" : "text-[#28251d]"
                                            }`}
                                          >
                                            {tDoc.title}
                                          </p>
                                          <p className="text-[11px] text-[#7a7974]">
                                            Category: {tDoc.category}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isFocused ? (
                                          <span className="text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-sm">
                                            Immediate focus
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-medium bg-[#e6e4df] text-[#7a7974] px-1.5 py-0.5 rounded-sm">
                                            Later
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-sm flex items-start gap-2.5 text-sm">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold text-rose-900">Recommended action</p>
                                <p className="text-rose-700 leading-normal">
                                  Defer secondary tasks for now and protect uninterrupted time for the
                                  top-priority item.
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RescuePage;