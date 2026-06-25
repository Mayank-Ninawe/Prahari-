import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ShieldAlert, 
  Zap, 
  Play, 
  Target, 
  ChevronRight, 
  Check, 
  Clock, 
  Minimize2, 
  Sliders, 
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Download
} from "lucide-react";
import { useAuth } from "../../components/ui/ProtectedRoute";
import { FirebaseService, TaskDocument, RescuePlanDocument } from "../../services/firebaseService";
import { GeminiService, Reprioritization } from "../../services/gemini";
import { Card, Badge, Button } from "../../components/ui/BaseComponents";
import { ExportHelper } from "../../utils/exportHelper";
import { LockedRoute } from "../../config/constants";

export function RescuePage() {
  const { firebaseUser, userDoc } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Gemini Rescue Plan States
  const [rescuePlans, setRescuePlans] = useState<RescuePlanDocument[]>([]);
  const [activePlan, setActivePlan] = useState<RescuePlanDocument | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [reprioritizing, setReprioritizing] = useState<boolean>(false);
  const [reprioritizeResult, setReprioritizeResult] = useState<Reprioritization | null>(null);
  
  // Interactive Step & Tab states
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"steps" | "compression" | "priority">("steps");

  // Focus Mode variables
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(1500); // 25:00
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusStepTitle, setFocusStepTitle] = useState<string>("");
  const [copiedReport, setCopiedReport] = useState(false);

  // Load all user tasks on mount
  useEffect(() => {
    if (!firebaseUser) return;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
        setTasks(fetchedTasks);
        
        // Determine initially selected taskId
        const stateTaskId = location.state?.taskId;
        if (stateTaskId && fetchedTasks.some(t => t.taskId === stateTaskId)) {
          setSelectedTaskId(stateTaskId);
        } else if (fetchedTasks.length > 0) {
          setSelectedTaskId(fetchedTasks[0].taskId);
        }
      } catch (err) {
        console.error("Error fetching tasks for rescue:", err);
        setError("Failed to load monitored workspace targets.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [firebaseUser, location.state]);

  const selectedTask = tasks.find(t => t.taskId === selectedTaskId);

  const isCompressed = activePlan && activePlan.compressionMode !== "not_needed";
  const displaySteps = isCompressed && activePlan?.compressedSteps ? activePlan.compressedSteps : activePlan?.steps || [];

  // Load rescue plans when selectedTaskId changes or selectedTask's selectedPlanId changes
  useEffect(() => {
    if (!firebaseUser || !selectedTaskId) return;
    const fetchPlans = async () => {
      try {
        setLoadingPlan(true);
        const plans = await FirebaseService.getRescuePlans(firebaseUser.uid, selectedTaskId);
        setRescuePlans(plans);
        if (plans.length > 0) {
          const currentSelectedPlanId = selectedTask?.selectedPlanId;
          const active = plans.find(p => p.planId === currentSelectedPlanId) || plans[0];
          setActivePlan(active);
          
          const completedMap: Record<string, boolean> = {};
          if (active.completedStepIds) {
            active.completedStepIds.forEach(id => {
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

  // Focus mode countdown logic
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

  // 1. Core Gemini Module: Generate Rescue Plan
  const handleGenerateRescuePlan = async () => {
    if (!firebaseUser || !selectedTask) return;
    try {
      setGeneratingPlan(true);
      setError("");
      
      const deadlineStr = selectedTask.deadline instanceof Date 
        ? selectedTask.deadline.toISOString()
        : (selectedTask.deadline as any)?.toDate?.()?.toISOString() || String(selectedTask.deadline);

      const riskAssessment = {
        riskScore: selectedTask.riskScore || 50,
        riskLevel: (selectedTask.riskLevel || "watch") as any,
        riskReasonSummary: selectedTask.riskReasonSummary || "Manually initialized Rescue Path.",
        topRiskFactors: ["Deadline pressure", "Workload capacity constraint"],
        recommendedMode: (selectedTask.riskLevel === "critical" ? "compress" : "rescue") as any
      };

      const newPlan = await GeminiService.generateRescuePlan({
        title: selectedTask.title,
        description: selectedTask.description,
        category: selectedTask.category,
        deadline: deadlineStr,
        estimatedMinutes: selectedTask.estimatedMinutes,
        priority: selectedTask.priority
      }, riskAssessment, {
        workStyle: userDoc?.workStyle || "normal",
        aggressiveness: userDoc?.demoModeEnabled ? "high" : "medium"
      });

      const planDoc: Partial<RescuePlanDocument> = {
        planTitle: newPlan.planTitle,
        planSummary: newPlan.planSummary,
        steps: newPlan.steps,
        totalEstimatedMinutes: newPlan.totalEstimatedMinutes,
        firstActionLabel: newPlan.firstActionLabel,
        compressionMode: "not_needed"
      };

      const planId = await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, planDoc);
      const savedPlan = { ...planDoc, planId, createdAt: new Date(), updatedAt: new Date() } as RescuePlanDocument;
      
      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        selectedPlanId: planId,
        status: "rescue_ready",
        nextActionLabel: newPlan.firstActionLabel,
        progressPercentage: 0,
        completedStepsCount: 0,
        totalStepsCount: newPlan.steps.length
      });

      // Reload tasks list to update selectedTask instantly
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      setActivePlan(savedPlan);
      setRescuePlans([savedPlan, ...rescuePlans]);
    } catch (err: any) {
      console.error("Failed to generate rescue plan:", err);
      setError("AI Generation failed. Ensure Gemini API key is properly configured.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  // 2. Core Gemini Module: Plan Compression
  const handleCompressRescuePlan = async (mode: "light" | "hard") => {
    if (!firebaseUser || !selectedTask || !activePlan) return;
    try {
      setCompressing(true);
      setError("");
      
      const deadlineStr = selectedTask.deadline instanceof Date 
        ? selectedTask.deadline.toISOString()
        : (selectedTask.deadline as any)?.toDate?.()?.toISOString() || String(selectedTask.deadline);

      const compressionResult = await GeminiService.compressRescuePlan({
        title: selectedTask.title,
        description: selectedTask.description,
        category: selectedTask.category,
        deadline: deadlineStr,
        estimatedMinutes: selectedTask.estimatedMinutes
      }, {
        planTitle: activePlan.planTitle,
        planSummary: activePlan.planSummary,
        steps: activePlan.steps,
        totalEstimatedMinutes: activePlan.totalEstimatedMinutes,
        firstActionLabel: activePlan.firstActionLabel
      }, `Compression is requested to ${mode} mode due to tight remaining time.`, {
        workStyle: userDoc?.workStyle || "normal",
        aggressiveness: mode === "hard" ? "high" : "medium"
      });

      const updatedPlanDoc: Partial<RescuePlanDocument> = {
        planId: activePlan.planId,
        compressionMode: mode,
        compressedSteps: compressionResult.compressedSteps,
        droppedOrDeferred: compressionResult.droppedOrDeferred,
        survivalGoal: compressionResult.survivalGoal,
        planSummary: compressionResult.compressedSummary
      };

      await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, updatedPlanDoc);
      
      // Recalculate progress for the compressed steps
      const newCompressedSteps = compressionResult.compressedSteps || [];
      const totalSteps = newCompressedSteps.length;
      const completedStepIds = activePlan.completedStepIds || [];
      const completedStepsCount = completedStepIds.filter(id => newCompressedSteps.some(s => s.stepId === id)).length;
      const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        status: "compressed",
        totalStepsCount: totalSteps,
        completedStepsCount,
        progressPercentage,
        nextActionLabel: newCompressedSteps.find(s => !completedStepIds.includes(s.stepId))?.title || "Continue Steps"
      });

      // Update local task list instantly
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      const completeUpdatedPlan = {
        ...activePlan,
        ...updatedPlanDoc,
        progressPercentage,
        updatedAt: new Date()
      } as RescuePlanDocument;

      setActivePlan(completeUpdatedPlan);
      setRescuePlans(prev => prev.map(p => p.planId === activePlan.planId ? completeUpdatedPlan : p));
      setActiveTab("compression");
    } catch (err) {
      console.error("Plan compression failed:", err);
      setError("Plan compression process failed.");
    } finally {
      setCompressing(false);
    }
  };

  // 3. Core Gemini Module: Reprioritizing Workspace Tasks list
  const handleReprioritize = async () => {
    if (!firebaseUser || !selectedTask) return;
    try {
      setReprioritizing(true);
      setError("");
      
      const deadlineStr = selectedTask.deadline instanceof Date 
        ? selectedTask.deadline.toISOString()
        : (selectedTask.deadline as any)?.toDate?.()?.toISOString() || String(selectedTask.deadline);

      const listPayload = tasks.map(t => {
        const dStr = t.deadline instanceof Date 
          ? t.deadline.toISOString()
          : (t.deadline as any)?.toDate?.()?.toISOString() || String(t.deadline);
        return {
          taskId: t.taskId,
          title: t.title,
          priority: t.priority,
          deadline: dStr,
          riskScore: t.riskScore
        };
      });

      const reprioritization = await GeminiService.reprioritizeTasks({
        taskId: selectedTask.taskId,
        title: selectedTask.title,
        priority: selectedTask.priority,
        deadline: deadlineStr
      }, listPayload);

      setReprioritizeResult(reprioritization);
      setActiveTab("priority");
    } catch (err) {
      console.error("Reprioritization failed:", err);
      setError("AI reprioritization process failed.");
    } finally {
      setReprioritizing(false);
    }
  };

  // Pomodoro Focus Trigger for individual step
  const handleStartFocusOnStep = async (title: string, durationMinutes: number) => {
    setFocusStepTitle(title);
    setFocusTimerSeconds(durationMinutes * 60);
    setIsFocusModeActive(true);
    setFocusTimerRunning(true);

    // If current plan is not activated yet, activate it automatically
    if (activePlan && selectedTask && selectedTask.selectedPlanId !== activePlan.planId) {
      await handleActivatePlan(activePlan);
    }
  };

  // Explicit Activation of a calculated Rescue Path (Part C)
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
        totalStepsCount: totalSteps
      });

      // Update plan document with completedStepIds if missing
      if (!plan.completedStepIds) {
        await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, {
          planId: plan.planId,
          completedStepIds: [],
          progressPercentage: 0
        });
      }

      // Reload tasks list
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      // Reload active plan representation
      const plans = await FirebaseService.getRescuePlans(firebaseUser.uid, selectedTask.taskId);
      setRescuePlans(plans);
      const active = plans.find(p => p.planId === plan.planId) || plans[0];
      setActivePlan(active);
      setCompletedSteps({});
    } catch (err) {
      console.error("Error activating plan:", err);
      setError("Failed to activate rescue path in Firestore.");
    } finally {
      setLoadingPlan(false);
    }
  };

  // Toggle checklist state with persistent Firestore updates and dynamic task status tracking (Part C & D)
  const toggleStepCompleted = async (stepId: string) => {
    if (!firebaseUser || !selectedTask || !activePlan) return;
    try {
      const isCurrentlyDone = !!completedSteps[stepId];
      let newCompletedIds = activePlan.completedStepIds || [];
      if (isCurrentlyDone) {
        newCompletedIds = newCompletedIds.filter(id => id !== stepId);
      } else {
        if (!newCompletedIds.includes(stepId)) {
          newCompletedIds = [...newCompletedIds, stepId];
        }
      }

      // Calculate progress percentage
      const totalSteps = displaySteps.length;
      const completedStepsCount = newCompletedIds.filter(id => displaySteps.some(s => s.stepId === id)).length;
      const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

      // Optimistically update local UI map for instant feedback
      setCompletedSteps(prev => ({
        ...prev,
        [stepId]: !isCurrentlyDone
      }));

      // Determine task status based on state
      let taskStatus = "in_progress";
      if (activePlan.compressionMode && activePlan.compressionMode !== "not_needed") {
        taskStatus = "compressed";
      }
      if (completedStepsCount === totalSteps && totalSteps > 0) {
        taskStatus = "completed";
      }

      // Save plan document update
      const updatedPlanData: Partial<RescuePlanDocument> = {
        planId: activePlan.planId,
        completedStepIds: newCompletedIds,
        progressPercentage
      };
      await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, updatedPlanData);

      // Get label for next action
      const nextPendingStep = displaySteps.find(s => !newCompletedIds.includes(s.stepId));
      const nextActionLabel = completedStepsCount === totalSteps 
        ? "Task Completed" 
        : nextPendingStep?.title || "Continue Steps";

      // Save task document update
      await FirebaseService.updateTask(firebaseUser.uid, selectedTask.taskId, {
        selectedPlanId: activePlan.planId,
        status: taskStatus,
        nextActionLabel,
        progressPercentage,
        completedStepsCount,
        totalStepsCount: totalSteps
      });

      // Reload tasks list to keep other UI elements updated
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);

      // Update active plan state
      setActivePlan(prev => prev ? { ...prev, ...updatedPlanData } : null);
    } catch (err) {
      console.error("Failed to toggle step completion:", err);
      setError("Failed to persist task progress in Firestore.");
    }
  };

  // Loader UI
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans bg-slate-50/50">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Syncing active target workspace...
        </p>
      </div>
    );
  }

  // Empty state UI
  if (tasks.length === 0) {
    return (
      <div id="rescue-empty-state" className="max-w-xl mx-auto py-16 text-center space-y-6 font-sans">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-200 shadow-2xs">
          <Layers className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-950">No active rescue contexts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            To view or configure a secure mitigation route, you must first register a target inside the Operational Command Center.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link to={LockedRoute.DASHBOARD}>
            <Button size="sm" variant="primary" icon={<ArrowRight className="w-3.5 h-3.5 text-white" />}>
              Go to Command Center
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="rescue-page-root" className="space-y-8 font-sans text-slate-900 text-left animate-fade-in">
      
      {/* FOCUS MODE OVERLAY SCREEN (IF ACTIVE) */}
      {isFocusModeActive && selectedTask && (
        <div id="focus-mode-stage" className="fixed inset-0 bg-slate-900 text-white z-50 flex flex-col justify-between p-8 sm:p-16 animate-fade-in font-sans">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-6 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-sm flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100">Prahari Focus Shell</h2>
                <p className="text-[10px] text-slate-400 font-mono">{selectedTask.title}</p>
              </div>
            </div>
            <button 
              id="exit-focus-shell-btn"
              onClick={() => {
                setIsFocusModeActive(false);
                setFocusTimerRunning(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 hover:border-white hover:bg-slate-800 text-slate-300 hover:text-white rounded-xs text-xs font-mono tracking-wide transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>TERMINATE FOCUS</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 max-w-5xl mx-auto w-full my-8">
            <div className="flex-1 space-y-6 w-full text-left">
              <div className="space-y-2">
                <Badge urgency="critical">ACTIVE FOCUS BLOCK</Badge>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold font-mono text-amber-500">MVT</span>
                  <h3 className="text-2xl font-bold tracking-tight text-white">{focusStepTitle || selectedTask.title}</h3>
                </div>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl bg-slate-800/50 p-6 rounded-sm border border-slate-700/50">
                {selectedTask.description || "Establish your focused execution block. Filter out any notification or scope creep to secure minimum viable delivery."}
              </p>

              <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Category: {selectedTask.category}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Total task estimate: {selectedTask.estimatedMinutes} mins
                </span>
              </div>
            </div>

            <div className="w-80 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 p-10 rounded-sm relative shadow-2xl">
              <div className="absolute top-4 left-4 text-[9px] font-mono tracking-widest text-slate-600 uppercase font-bold">COGNITIVE GUARD</div>
              
              <div className="text-6xl font-mono text-white font-bold tracking-tight my-6 animate-pulse select-none">
                {formatFocusTimer()}
              </div>

              <div className="flex gap-4 w-full">
                <button
                  id="timer-toggle-btn"
                  onClick={() => setFocusTimerRunning(!focusTimerRunning)}
                  className={`flex-1 py-2.5 rounded-xs text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    focusTimerRunning 
                      ? "bg-rose-600 hover:bg-rose-700 text-white" 
                      : "bg-white text-slate-950 hover:bg-slate-200"
                  }`}
                >
                  {focusTimerRunning ? "PAUSE" : "ENGAGE"}
                </button>
                <button
                  id="timer-reset-btn"
                  onClick={() => {
                    setFocusTimerSeconds(1500);
                    setFocusTimerRunning(false);
                  }}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xs text-xs font-mono uppercase font-bold transition-all cursor-pointer"
                >
                  RESET
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
            <span>COGNITIVE GUARD ACTIVE // PRAHARI AI</span>
            <span>SHIELDS LOCKED ON STEADY DELIVERY</span>
          </div>
        </div>
      )}

      {/* ACTIVE RESCUE BOARD PAGE LAYOUT */}
      <div id="rescue-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Active Rescue Matrix</h2>
          <p className="text-xs text-slate-500 font-sans">
            Isolate compliance boundaries, evaluate delivery velocity, and engage focus shields.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-sans">
          <label htmlFor="target-select" className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Select Target Context:
          </label>
          <select
            id="target-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-250 rounded-xs focus:ring-0 focus:outline-hidden cursor-pointer"
          >
            {tasks.map(t => (
              <option key={t.taskId} value={t.taskId}>
                {t.title} ({t.priority.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-2 font-sans">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {selectedTask && (
        <div className="space-y-6">
          
          {/* Dynamic Escalation and Intervention Layer */}
          {(() => {
            const isStandby = selectedTask.status === "rescue_ready";
            const isCritical = selectedTask.riskLevel === "critical" || selectedTask.priority === "critical";
            
            // Check for remaining time to recommend compression
            const deadlineMillis = selectedTask.deadline instanceof Date 
              ? selectedTask.deadline.getTime() 
              : (selectedTask.deadline as any)?.toDate?.()?.getTime() || new Date(selectedTask.deadline as any).getTime();
            const nowMillis = Date.now();
            const remainingMinutes = Math.max(0, (deadlineMillis - nowMillis) / (1000 * 60));
            const isTimeOverdue = remainingMinutes > 0 && remainingMinutes < (selectedTask.estimatedMinutes || 60);
            const needsCompression = selectedTask.status === "in_progress" && isTimeOverdue;

            if (isStandby && activePlan) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
                  <div className="flex gap-2.5 items-start sm:items-center text-left">
                    <span className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-amber-900 font-mono uppercase text-[10px] tracking-wide">Tactical Rescue Path Standby</h5>
                      <p className="text-amber-800 leading-normal text-[11px]">
                        A customized mitigation path is configured. Activate this rescue plan to begin live milestone tracking.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleActivatePlan(activePlan)}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer border-none"
                  >
                    Activate Rescue Plan
                  </button>
                </div>
              );
            }

            if (needsCompression) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
                  <div className="flex gap-2.5 items-start sm:items-center text-left">
                    <span className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Minimize2 className="w-4 h-4 text-amber-600 animate-pulse" />
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-amber-900 font-mono uppercase text-[10px] tracking-wide">AI Compression Recommended</h5>
                      <p className="text-amber-800 leading-normal text-[11px]">
                        High time pressure detected. You have pending milestones with only {Math.round(remainingMinutes)} mins left. Run Prahari scope compression.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("compression")}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer border-none"
                  >
                    Go to Compression Panel
                  </button>
                </div>
              );
            }

            if (isCritical) {
              return (
                <div className="p-4 bg-rose-500/10 border border-rose-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
                  <div className="flex gap-2.5 items-start sm:items-center text-left">
                    <span className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-rose-900 font-mono uppercase text-[10px] tracking-wide">Critical Threat Intervention Alert</h5>
                      <p className="text-rose-800 leading-normal text-[11px]">
                        Workspace target is flagged under immediate deadline failure hazard. Execute active rescue steps and deploy focus shields.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsFocusModeActive(true);
                      setFocusTimerRunning(true);
                    }}
                    className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer animate-pulse border-none"
                  >
                    Lock Focus Shields
                  </button>
                </div>
              );
            }

            return null;
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          
          {/* LEFT COLUMN: SELECTED TARGET DETAILS & CONTROL PANEL */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Target Card */}
            <Card className="border border-slate-200 bg-white p-6 space-y-5">
              <div className="border-b border-slate-150 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400">Workspace Target Detail</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedTask.title}</h3>
                  </div>
                </div>
                <Badge urgency={selectedTask.priority === "critical" ? "critical" : selectedTask.priority === "high" ? "high" : "low"}>
                  {selectedTask.priority.toUpperCase()} RISK
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xs border border-slate-150">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Category Class</span>
                  <p className="font-semibold text-slate-800">{selectedTask.category}</p>
                </div>
                
                <div className="space-y-1 bg-slate-50 p-3 rounded-xs border border-slate-150">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Milestone Status</span>
                  <p className="font-semibold text-slate-800 uppercase tracking-wider">{selectedTask.status}</p>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xs border border-slate-150">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Hard Deadline</span>
                  <p className="font-semibold text-slate-800 text-rose-700">
                    {selectedTask.deadline instanceof Date 
                      ? selectedTask.deadline.toLocaleDateString()
                      : (selectedTask.deadline as any)?.toDate?.()?.toLocaleDateString() || String(selectedTask.deadline)}
                  </p>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xs border border-slate-150">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Estimated Effort</span>
                  <p className="font-semibold text-slate-800">{(selectedTask.estimatedMinutes / 60).toFixed(1)} Hours</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed pt-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Description / Scope Boundaries</span>
                <p className="bg-slate-50/50 p-3.5 border border-slate-150 rounded-xs text-slate-700">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              {selectedTask.riskReasonSummary && (
                <div className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-xs text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold font-mono text-[10px] uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Risk Diagnosis Score: {selectedTask.riskScore}%
                  </div>
                  <p className="text-slate-600 leading-relaxed">{selectedTask.riskReasonSummary}</p>
                </div>
              )}
            </Card>

            {/* AI Control Center Panel */}
            <Card className="border border-slate-200 bg-slate-50 p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Tactical Control Block</h3>
              
              <div className="space-y-2.5">
                {/* Generate Button */}
                <button
                  onClick={handleGenerateRescuePlan}
                  disabled={generatingPlan}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xs text-xs font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Sparkles className={`w-4.5 h-4.5 text-amber-400 ${generatingPlan ? "animate-spin" : ""}`} />
                  {generatingPlan ? "Generating Plan..." : activePlan ? "Regenerate Rescue Path" : "Deploy Rescue Plan"}
                </button>

                {/* Reprioritize Button */}
                <button
                  onClick={handleReprioritize}
                  disabled={reprioritizing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-250 hover:bg-slate-50 text-slate-800 rounded-xs text-xs font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Sliders className={`w-4 h-4 text-slate-400 ${reprioritizing ? "animate-spin" : ""}`} />
                  {reprioritizing ? "Simulating Sequence..." : "Prioritize Focus Path"}
                </button>
              </div>

              {/* Pomodoro Focus trigger shortcut inside tactical control */}
              <div className="pt-4 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ENGINES CONNECTED
                </span>
                <span className="bg-slate-200/60 px-1.5 py-0.5 rounded-sm">VITE + FIRESTORE</span>
              </div>
            </Card>

            {/* Rescue Path Catalog Block (Part C & D) */}
            {rescuePlans.length > 0 && (
              <Card className="border border-slate-200 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">Rescue Path Catalog</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Manage and deploy Gemini calculated paths.</p>
                  </div>
                  <Database className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {rescuePlans.map((plan) => {
                    const isActive = plan.planId === selectedTask.selectedPlanId;
                    const stepsCount = plan.steps?.length || 0;
                    
                    return (
                      <div 
                        key={plan.planId} 
                        className={`p-3 rounded-xs border text-xs text-left transition-all ${
                          isActive 
                            ? "border-emerald-300 bg-emerald-50/20" 
                            : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-800 leading-snug">{plan.planTitle}</div>
                          {isActive ? (
                            <span className="shrink-0 text-[8px] font-mono font-bold bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded-sm uppercase tracking-wide flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" /> Active
                            </span>
                          ) : (
                            <span className="shrink-0 text-[8px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                          {plan.planSummary}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[9px] font-mono text-slate-400">
                          <span>{stepsCount} steps // {plan.totalEstimatedMinutes} mins</span>
                          {isActive ? (
                            <span className="text-emerald-700 font-bold">{plan.progressPercentage || 0}% Done</span>
                          ) : (
                            <button
                              onClick={() => handleActivatePlan(plan)}
                              className="px-2 py-0.5 border border-slate-250 hover:border-slate-950 bg-white hover:bg-slate-50 rounded-xs text-slate-700 hover:text-slate-950 font-bold tracking-wide uppercase transition-all cursor-pointer"
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

          {/* RIGHT COLUMN: INTERACTIVE TABS VIEW (STEPS checklist / AI COMPRESSION / PRIORITIZED LIST) */}
          <div className="lg:col-span-7 space-y-6">
            
            {!activePlan && !generatingPlan ? (
              /* If no plan generated yet, show nice operational standby empty state */
              <Card className="border border-slate-200 bg-white p-12 text-center space-y-5 flex flex-col justify-center min-h-[400px]">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-250">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">No Mitigation Path Active</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    The AI rescue engine is in standby. Click 'Deploy Rescue Plan' to generate a tactical execution sequence using Gemini's structured output.
                  </p>
                </div>
                <div>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={handleGenerateRescuePlan}
                    className="bg-slate-900 hover:bg-slate-800 uppercase font-mono text-[10px] tracking-widest font-bold font-sans"
                    icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    Deploy Rescue Plan
                  </Button>
                </div>
              </Card>
            ) : (
              /* Main Interactive execution workspace */
              <div className="space-y-6">
                
                {/* Visual Tab Buttons */}
                <div className="flex border-b border-slate-200 bg-slate-50 p-1 rounded-sm gap-1">
                  <button
                    onClick={() => setActiveTab("steps")}
                    className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xs transition-all cursor-pointer ${
                      activeTab === "steps" 
                        ? "bg-white text-slate-950 border border-slate-200 shadow-3xs" 
                        : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    📋 Task Checklist
                  </button>
                  <button
                    onClick={() => setActiveTab("compression")}
                    className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xs transition-all cursor-pointer ${
                      activeTab === "compression" 
                        ? "bg-white text-slate-950 border border-slate-200 shadow-3xs" 
                        : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    ⚡ AI Compression {isCompressed && <span className="ml-1 text-[9px] bg-red-100 text-red-900 px-1 rounded-sm">ACTIVE</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab("priority")}
                    className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xs transition-all cursor-pointer ${
                      activeTab === "priority" 
                        ? "bg-white text-slate-950 border border-slate-200 shadow-3xs" 
                        : "text-slate-500 hover:text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    ⚙️ Focus Sequence
                  </button>
                </div>

                {/* TAB CONTENT: 1. STEPS CHECKLIST */}
                {activeTab === "steps" && activePlan && (
                  <Card className="border border-slate-200 bg-white p-6 space-y-6">
                    {/* Activation CTA Banner if current plan is not activated in Task document */}
                    {selectedTask.selectedPlanId !== activePlan.planId && (
                      <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-left">
                          <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 font-mono uppercase">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            Tactical Rescue Path Standby
                          </h5>
                          <p className="text-[11px] text-amber-800 leading-normal">
                            This plan has been generated successfully. Activate this rescue path to align milestone telemetry and begin focus tracking.
                          </p>
                        </div>
                        <button
                          onClick={() => handleActivatePlan(activePlan)}
                          className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xs text-[10px] font-mono uppercase tracking-wider font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Activate Rescue Path
                        </button>
                      </div>
                    )}

                    <div className="border-b border-slate-150 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                          Mitigation Route Connected
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{activePlan.planTitle}</h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleCopyRescueReport}
                          className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-950 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Copy standard markdown report to clipboard"
                        >
                          {copiedReport ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied Report!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Protocol</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={handleDownloadRescueReport}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-none"
                          title="Download emergency text report"
                        >
                          <Download className="w-3 h-3 text-amber-400" />
                          <span>Download Report</span>
                        </button>

                        <div className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1.5 rounded-sm shrink-0">
                          {activePlan.totalEstimatedMinutes} mins
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 border border-slate-150 rounded-xs">
                      "{activePlan.planSummary}"
                    </p>

                    {/* Interactive execution checklist items */}
                    <div className="space-y-3.5">
                      {displaySteps.map((step, idx) => {
                        const isDone = completedSteps[step.stepId];
                        return (
                          <div 
                            key={step.stepId} 
                            className={`p-4 border rounded-sm flex items-start gap-3.5 transition-all duration-200 ${
                              isDone 
                                ? "bg-slate-50/75 border-slate-200 opacity-60" 
                                : "bg-white border-slate-200 hover:border-slate-350"
                            }`}
                          >
                            <button 
                              onClick={() => toggleStepCompleted(step.stepId)}
                              className="mt-1 cursor-pointer shrink-0"
                            >
                              <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${
                                isDone 
                                  ? "bg-slate-900 border-slate-900 text-white" 
                                  : "border-slate-350 bg-white hover:border-slate-950"
                              }`}>
                                {isDone && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </button>

                            <div className="flex-1 min-w-0 text-left space-y-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">STEP {idx + 1}</span>
                                <h5 className={`text-xs font-bold leading-tight ${isDone ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                  {step.title}
                                </h5>
                                <Badge urgency={step.urgencyTag === "now" ? "critical" : step.urgencyTag === "soon" ? "medium" : "low"}>
                                  {step.urgencyTag}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {step.description}
                              </p>
                              
                              <div className="pt-2 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Duration: {step.estimatedMinutes} Mins // Method: {step.completionType.toUpperCase()}</span>
                                {!isDone && (
                                  <button
                                    onClick={() => handleStartFocusOnStep(step.title, step.estimatedMinutes)}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-250 hover:border-amber-350 text-amber-800 rounded-xs font-bold tracking-wide uppercase transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3 fill-amber-800" />
                                    Launch Focus Timer
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

                {/* TAB CONTENT: 2. AI COMPRESSION WORKBENCH */}
                {activeTab === "compression" && activePlan && (
                  <Card className="border border-slate-200 bg-white p-6 space-y-6 text-left">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900">Emergency Scope Compression Workbench</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        If delivery time is compromised, instruct Gemini to prune non-critical functions and isolate the absolute minimal viable output.
                      </p>
                    </div>

                    {/* Compression Triggers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-slate-200 rounded-sm p-4 space-y-3.5 bg-slate-50/45">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-sm">SOFT COMPRESSION</span>
                          <h5 className="text-xs font-bold text-slate-950 mt-1">Light Scope Trimming</h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Compress timelines by 20-30%. Defer auxiliary logging or minor styling assets to maintain strict timeline integrity.
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompressRescuePlan("light")}
                          disabled={compressing}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xs text-[10px] font-mono uppercase font-bold tracking-wider cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {compressing ? "Pruning..." : "Engage Light Compression"}
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-sm p-4 space-y-3.5 bg-slate-50/45">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded-sm">CRITICAL SURVIVAL MODE</span>
                          <h5 className="text-xs font-bold text-slate-950 mt-1">Extreme Scope Compression</h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Reduce timelines by 50%+. Prune anything except the primary database transaction fields. Survival-oriented minimum MVP block.
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompressRescuePlan("hard")}
                          disabled={compressing}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xs text-[10px] font-mono uppercase font-bold tracking-wider cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {compressing ? "Compressing..." : "Engage Hard Compression"}
                        </button>
                      </div>
                    </div>

                    {/* Displays current compressed parameters */}
                    {isCompressed && (
                      <div className="p-5 border border-amber-250 bg-amber-50/20 rounded-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-900 font-mono uppercase">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Compression active ({activePlan.compressionMode?.toUpperCase()})
                          </div>
                          <button
                            onClick={async () => {
                              // Reset plan back to nominal state
                              try {
                                setCompressing(true);
                                await FirebaseService.saveRescuePlan(firebaseUser.uid, selectedTask.taskId, {
                                  planId: activePlan.planId,
                                  compressionMode: "not_needed"
                                });
                                // Reload page plans
                                const plans = await FirebaseService.getRescuePlans(firebaseUser.uid, selectedTaskId);
                                setRescuePlans(plans);
                                if (plans.length > 0) setActivePlan(plans[0]);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setCompressing(false);
                              }
                            }}
                            className="text-[10px] font-mono uppercase font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Reset Scope
                          </button>
                        </div>

                        {activePlan.survivalGoal && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono uppercase font-bold text-amber-800 block">Isolated MVP Goal</span>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed">"{activePlan.survivalGoal}"</p>
                          </div>
                        )}

                        {activePlan.droppedOrDeferred && activePlan.droppedOrDeferred.length > 0 && (
                          <div className="space-y-1 pt-1.5">
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block">Deferred Features / Exclusions</span>
                            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                              {activePlan.droppedOrDeferred.map((item, i) => (
                                <li key={i} className="leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {/* TAB CONTENT: 3. PRIORITIZED SEQUENCE LIST */}
                {activeTab === "priority" && (
                  <Card className="border border-slate-200 bg-white p-6 space-y-6 text-left">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900">Sequence Re-prioritization Workbench</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Assess other monitored workspace targets, pin current target to top priority, and defer secondary targets to establish a clear singular focus line.
                      </p>
                    </div>

                    {!reprioritizeResult && !reprioritizing ? (
                      <div className="p-8 border border-slate-150 rounded-xs text-center space-y-4 bg-slate-50/50">
                        <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                          Ready to simulate workspace sequence. Click below to analyze timelines and formulate a deterministic task prioritization matrix.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleReprioritize}
                          className="font-mono text-[10px] uppercase font-bold cursor-pointer"
                        >
                          Simulate Prioritization Sequence
                        </Button>
                      </div>
                    ) : reprioritizing ? (
                      <div className="p-12 text-center space-y-3">
                        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
                        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider animate-pulse">Running priority simulation...</p>
                      </div>
                    ) : (
                      reprioritizeResult && (
                        <div className="space-y-5">
                          
                          {/* Explanation Card */}
                          <div className="p-4 bg-slate-900 text-white rounded-xs space-y-1.5 relative overflow-hidden">
                            <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-500">SIMULATED SCENARIO</div>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold">AI Sequence Reasoning</span>
                            <p className="text-xs text-slate-300 leading-relaxed">{reprioritizeResult.explanation}</p>
                          </div>

                          {/* Focus Priority List */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">Simulated Execution Sequence</span>
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-sm overflow-hidden bg-white">
                              {reprioritizeResult.prioritizedTaskIds.map((tid, index) => {
                                const tDoc = tasks.find(t => t.taskId === tid);
                                if (!tDoc) return null;
                                const isFocused = tid === reprioritizeResult.immediateFocusTaskId;
                                
                                return (
                                  <div 
                                    key={tid} 
                                    className={`p-3.5 flex items-center justify-between text-xs transition-colors ${
                                      isFocused ? "bg-amber-50/40 border-l-2 border-l-amber-500" : "bg-white"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono font-bold text-slate-400 w-4">{index + 1}</span>
                                      <div className="space-y-0.5">
                                        <p className={`font-bold ${isFocused ? "text-amber-950" : "text-slate-800"}`}>{tDoc.title}</p>
                                        <p className="text-[10px] text-slate-400">Category: {tDoc.category}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isFocused ? (
                                        <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-sm font-bold">
                                          IMMEDIATE FOCUS
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                          DEFERRED
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action advice */}
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xs flex items-start gap-2.5 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold text-rose-900">Immediate Action Required</p>
                              <p className="text-rose-700 leading-normal">
                                We recommend deferring any activities related to the secondary items in order to preserve absolute development focus on your current MVP target.
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
