import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import {
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Target,
  Hourglass,
  ShieldCheck,
  Clock,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Sliders,
  Check,
  Plus,
  Trash2,
  X,
  Bell,
} from "lucide-react";
import { LockedRoute } from "@/config/constants";
import { useAuth } from "@/components/ui/ProtectedRoute";
import { FirebaseService, TaskDocument } from "../../services/firebaseService";
import { GeminiService } from "../../services/gemini";
import { NotificationService, NotificationDocument } from "../../services/notificationService";
import { DemoService } from "../../services/demoService";

export function DashboardPage() {
  const { firebaseUser, userDoc } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = React.useState<TaskDocument[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("Compliance");
  const [deadline, setDeadline] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(120);
  const [priority, setPriority] = React.useState("high");
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);

  const [isDemoSandboxOpen, setIsDemoSandboxOpen] = React.useState(false);
  const [demoActionLoading, setDemoActionLoading] = React.useState(false);
  const [demoMessage, setDemoMessage] = React.useState("");

  const [notifications, setNotifications] = React.useState<NotificationDocument[]>([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);
  const [nudgeClosed, setNudgeClosed] = React.useState(false);
  const [permissionState, setPermissionState] = React.useState<NotificationPermission>("default");

  React.useEffect(() => {
    setPermissionState(NotificationService.getPermissionState());
  }, []);

  // ─── OPTIMISTIC UPDATE CALLBACKS ─────────────────────────────────────────────

  const onOptimisticTaskCreate = (tempTask: TaskDocument) => {
    setTasks((prev) => {
      if (prev.some((t) => t.taskId === tempTask.taskId)) {
        return prev;
      }
      return [tempTask, ...prev];
    });
  };

  const onTaskCreateSuccess = (tempId: string, realTaskOrId: TaskDocument | string) => {
    setTasks((prev) => {
      const realId = typeof realTaskOrId === "string" ? realTaskOrId : realTaskOrId.taskId;
      const hasReal = prev.some((t) => t.taskId === realId && t.taskId !== tempId);

      if (hasReal) {
        return prev.filter((t) => t.taskId !== tempId);
      }

      return prev.map((t) => {
        if (t.taskId === tempId) {
          if (typeof realTaskOrId === "string") {
            return { ...t, taskId: realId };
          } else {
            return realTaskOrId;
          }
        }
        return t;
      });
    });
  };

  const onTaskCreateError = (tempId: string) => {
    setTasks((prev) => prev.filter((t) => t.taskId !== tempId));
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const loadNotifications = async (uid: string, currentTasks: TaskDocument[]) => {
    try {
      setLoadingNotifications(true);
      const isPushPreferred = userDoc?.notificationPreferences?.webPush || false;
      const list = await NotificationService.evaluateEscalationTriggers(
        uid,
        currentTasks,
        isPushPreferred
      );
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!firebaseUser) return;
    try {
      await NotificationService.markAsRead(firebaseUser.uid, notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!firebaseUser || notifications.length === 0) return;
    try {
      await NotificationService.markAllAsRead(firebaseUser.uid, notifications);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleRequestPermissionInline = async () => {
    const result = await NotificationService.requestPermission();
    setPermissionState(result);
    if (result === "granted") {
      NotificationService.sendLocalBrowserNotification(
        "Prahari AI Alerts Enabled",
        "You’ll now receive important deadline alerts in real time."
      );
    }
  };

  const loadTasks = async () => {
    if (!firebaseUser) return;
    try {
      // 1. Instant optimistic load from local cache
      const cached = FirebaseService.getCachedTasks(firebaseUser.uid);
      if (cached && cached.length > 0) {
        setTasks((prev) => {
          const temps = prev.filter((t) => t.taskId.startsWith("temp_"));
          const merged = [...temps, ...cached.filter((c) => !temps.some((t) => t.taskId === c.taskId))];
          return merged;
        });
        setLoading(false); // Remove loading state immediately
      } else {
        setLoading(true);
      }
      
      setError("");
      
      // 2. Fetch fresh data from Firestore in the background
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks((prev) => {
        const temps = prev.filter((t) => t.taskId.startsWith("temp_"));
        const filteredFetched = fetchedTasks.filter(
          (ft) => !temps.some((t) => t.taskId === ft.taskId)
        );
        return [...temps, ...filteredFetched];
      });
      
      // 3. Load notifications based on fresh tasks
      loadNotifications(firebaseUser.uid, fetchedTasks);
    } catch (err: any) {
      setError("We couldn’t load your tasks right now. Please refresh and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!firebaseUser) return;
    try {
      setDemoActionLoading(true);
      setDemoMessage("");
      await DemoService.seedDemoWorkspace(firebaseUser.uid);
      setDemoMessage("Demo tasks loaded successfully.");
      
      // Instant update from cache instead of waiting for Firestore
      setTasks(FirebaseService.getCachedTasks(firebaseUser.uid));
      setTimeout(() => setDemoMessage(""), 6000);
      
      // Still trigger a background reload to ensure sync eventually settles
      FirebaseService.getUserTasks(firebaseUser.uid).then((fresh) => {
        setTasks(fresh);
        loadNotifications(firebaseUser.uid, fresh);
      }).catch(console.error);
    } catch (err) {
      console.error("Demo seeding failed:", err);
      setError("We couldn’t load the demo tasks right now.");
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!firebaseUser) return;
    try {
      setDemoActionLoading(true);
      setDemoMessage("");
      await DemoService.resetToEmptyWorkspace(firebaseUser.uid);
      setDemoMessage("Demo tasks cleared.");
      
      // Instant update from cache
      setTasks(FirebaseService.getCachedTasks(firebaseUser.uid));
      setTimeout(() => setDemoMessage(""), 6000);
      
      // Still trigger background reload
      FirebaseService.getUserTasks(firebaseUser.uid).then((fresh) => {
        setTasks(fresh);
        loadNotifications(firebaseUser.uid, fresh);
      }).catch(console.error);
    } catch (err) {
      console.error("Demo reset failed:", err);
      setError("We couldn’t clear the demo tasks right now.");
    } finally {
      setDemoActionLoading(false);
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, [firebaseUser]);

  const [assessingTaskId, setAssessingTaskId] = React.useState<string | null>(null);

  const handleReassessTask = async (task: TaskDocument) => {
    if (!firebaseUser) return;
    try {
      setAssessingTaskId(task.taskId);
      setError("");

      const deadlineStr =
        task.deadline instanceof Date
          ? task.deadline.toISOString()
          : (task.deadline as any)?.toDate?.()?.toISOString() || String(task.deadline);

      const assessmentResult = await GeminiService.assessTaskRisk(
        {
          title: task.title,
          description: task.description,
          category: task.category,
          deadline: deadlineStr,
          estimatedMinutes: task.estimatedMinutes,
          priority: task.priority,
        },
        {
          workStyle: userDoc?.workStyle || "normal",
          aggressiveness: userDoc?.demoModeEnabled ? "high" : "medium",
          timezone: userDoc?.timezone || "Asia/Kolkata",
        }
      );

      await FirebaseService.updateTask(firebaseUser.uid, task.taskId, {
        riskScore: assessmentResult.riskScore,
        riskLevel: assessmentResult.riskLevel,
        riskReasonSummary: assessmentResult.riskReasonSummary,
        aiLastEvaluatedAt: new Date(),
        nextActionLabel:
          assessmentResult.recommendedMode === "compress"
            ? "Needs compression"
            : assessmentResult.recommendedMode === "rescue"
            ? "Needs rescue plan"
            : "Stay on track",
      });

      await loadTasks();
    } catch (err: any) {
      console.error("Manual reassessment failed:", err);
      setError("AI reassessment failed. Please check your Gemini setup and try again.");
    } finally {
      setAssessingTaskId(null);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || isSubmitting) return;

    if (!title || !deadline) {
      setError("Please fill in the task title and due date.");
      return;
    }

    // Capture form values to build the optimistic task
    const currentTitle = title;
    const currentDescription = description;
    const currentCategory = category;
    const currentDeadline = deadline;
    const currentEstimatedMinutes = Number(estimatedMinutes);
    const currentPriority = priority;

    const tempId = `temp_${Date.now()}`;
    const optimisticTask: TaskDocument = {
      taskId: tempId,
      title: currentTitle,
      description: currentDescription,
      category: currentCategory,
      deadline: new Date(currentDeadline),
      estimatedMinutes: currentEstimatedMinutes,
      priority: currentPriority,
      status: "draft",
      riskScore: 0,
      riskLevel: "safe",
      riskReasonSummary: "",
      aiLastEvaluatedAt: null,
      selectedPlanId: "",
      nextActionLabel: "",
      countdownStart: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual",
    };

    setIsSubmitting(true);
    setError("");

    // 1. Instantly render optimistic task
    onOptimisticTaskCreate(optimisticTask);

    // 2. Close modal & reset form states immediately
    setIsFormOpen(false);
    setTitle("");
    setDescription("");
    setCategory("Compliance");
    setDeadline("");
    setEstimatedMinutes(120);
    setPriority("high");

    // 3. Save to Firebase in the background
    FirebaseService.createTask(firebaseUser.uid, {
      title: currentTitle,
      description: currentDescription,
      category: currentCategory,
      deadline: new Date(currentDeadline),
      estimatedMinutes: currentEstimatedMinutes,
      priority: currentPriority,
    })
      .then(async (realId) => {
        setIsSubmitting(false);
        // Reconcile temp task with real task ID
        onTaskCreateSuccess(tempId, realId);

        // Run AI risk assessment in background without blocking
        try {
          const assessmentResult = await GeminiService.assessTaskRisk(
            {
              title: currentTitle,
              description: currentDescription,
              category: currentCategory,
              deadline: new Date(currentDeadline).toISOString(),
              estimatedMinutes: currentEstimatedMinutes,
              priority: currentPriority,
            },
            {
              workStyle: userDoc?.workStyle || "normal",
              aggressiveness: userDoc?.demoModeEnabled ? "high" : "medium",
              timezone: userDoc?.timezone || "Asia/Kolkata",
            }
          );

          await FirebaseService.updateTask(firebaseUser.uid, realId, {
            riskScore: assessmentResult.riskScore,
            riskLevel: assessmentResult.riskLevel,
            riskReasonSummary: assessmentResult.riskReasonSummary,
            aiLastEvaluatedAt: new Date(),
            nextActionLabel:
              assessmentResult.recommendedMode === "compress"
                ? "Needs compression"
                : assessmentResult.recommendedMode === "rescue"
                ? "Needs rescue plan"
                : "Stay on track",
          });

          // Update task in local state with assessment result
          setTasks((prev) =>
            prev.map((t) => {
              if (t.taskId === realId) {
                return {
                  ...t,
                  riskScore: assessmentResult.riskScore,
                  riskLevel: assessmentResult.riskLevel,
                  riskReasonSummary: assessmentResult.riskReasonSummary,
                  aiLastEvaluatedAt: new Date(),
                  nextActionLabel:
                    assessmentResult.recommendedMode === "compress"
                      ? "Needs compression"
                      : assessmentResult.recommendedMode === "rescue"
                      ? "Needs rescue plan"
                      : "Stay on track",
                };
              }
              return t;
            })
          );
        } catch (aiErr) {
          console.error("AI risk assessment failed in background on task creation:", aiErr);
        }
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError("We couldn’t save this task to the server. Rolling back.");
        console.error("Error creating task in background:", err);
        // Rollback optimistic task
        onTaskCreateError(tempId);
      });
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || !firebaseUser) return;
    try {
      setLoading(true);
      setError("");
      await FirebaseService.deleteTask(firebaseUser.uid, taskToDelete);
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task. Please try again.");
    } finally {
      setTaskToDelete(null);
      setLoading(false);
    }
  };

  const handleLoadDemoScenarios = async () => {
    if (!firebaseUser) return;
    try {
      setLoading(true);
      await DemoService.seedDemoWorkspace(firebaseUser.uid);
      // Instant update from cache
      setTasks(FirebaseService.getCachedTasks(firebaseUser.uid));
      
      // Background load
      FirebaseService.getUserTasks(firebaseUser.uid).then((fresh) => {
        setTasks(fresh);
        loadNotifications(firebaseUser.uid, fresh);
      }).catch(console.error);
    } catch (err) {
      console.error("Error seeding demo tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const criticalTasksCount = tasks.filter(
    (t) => t.priority === "critical" || t.priority === "high"
  ).length;

  const totalEstimatedMinutes = tasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 0),
    0
  );
  const totalEstimatedHours = Math.ceil(totalEstimatedMinutes / 60);

  const stabilizedCount = tasks.filter(
    (t) => t.status === "completed" || t.status === "mitigated"
  ).length;

  const spotlightTask =
    tasks.find((t) => t.priority === "critical") ||
    tasks.find((t) => t.priority === "high") ||
    tasks[0];

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
      if (typeof deadlineVal.toDate === "function") {
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
    } catch (err) {
      return String(deadlineVal);
    }
  };

  const getFriendlyNotificationType = (type: string) => {
    const map: Record<string, string> = {
      deadline_risk: "Deadline risk",
      overload_warning: "Workload warning",
      plan_update: "Plan updated",
      rescue_needed: "Rescue needed",
      priority_shift: "Priority changed",
    };
    return map[type] || type.replace(/_/g, " ");
  };

  return (
    <div
      id="dashboard-page-root"
      className="space-y-10 font-sans text-[#28251d] animate-fade-in text-left pb-16"
    >
      {/* =========================================================================
          ZONE 1: HEADER
          ========================================================================= */}
      <div
        id="dashboard-header"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#28251d]/12"
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#28251d] font-serif">
            Deadline overview
          </h2>
          <p className="text-sm text-[#7a7974]">
            Your tasks and rescue plans are ready for{" "}
            <span className="font-medium text-[#28251d]">
              {userDoc?.fullName || firebaseUser?.email}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            id="create-task-btn"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 bg-[#01696f] hover:bg-[#005156] text-white px-5 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm hover:-translate-y-0.5 hover:shadow cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add a deadline</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-sm flex items-center gap-2.5 animate-fade-in">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {NotificationService.isSupported() &&
        permissionState === "default" &&
        !nudgeClosed && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm animate-fade-in">
            <div className="flex gap-3 items-start sm:items-center">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <h5 className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Turn on deadline alerts
                </h5>
                <p className="text-[#7a7974] leading-normal text-sm max-w-2xl">
                  Get notified when a task needs urgent attention.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleRequestPermissionInline}
                className="px-3 py-1.5 bg-[#01696f] hover:bg-[#005156] text-white rounded-sm text-sm font-medium transition-all cursor-pointer border-none"
              >
                Enable alerts
              </button>
              <button
                onClick={() => setNudgeClosed(true)}
                className="p-1 hover:bg-[#f3f0ec] rounded-sm text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer border-none bg-transparent"
                title="Dismiss prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      {/* =========================================================================
          ZONE 2: HERO
          ========================================================================= */}
      <section id="primary-status-hero" className="w-full">
        {loading ? (
          <div className="w-full bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-12 text-center flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-[#01696f] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-[#7a7974]">Loading your tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#01696f]"></div>
            <div className="w-12 h-12 bg-[#01696f]/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-[#01696f]" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#28251d]">
                No active tasks yet
              </h3>
              <p className="text-sm text-[#7a7974] leading-relaxed">
                Add your first deadline or load demo tasks to see how Prahari
                identifies risk and builds rescue plans.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={handleLoadDemoScenarios}
                className="px-5 py-2.5 bg-[#01696f] hover:bg-[#005156] text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm shadow-sm transition-all cursor-pointer border-none"
              >
                Load demo tasks
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-5 py-2.5 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer"
              >
                Add your first task
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-6 sm:p-8 grid lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#01696f]"></div>

            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      criticalTasksCount > 0
                        ? "bg-amber-600 animate-pulse"
                        : "bg-emerald-600"
                    }`}
                  ></span>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#7a7974]">
                    {criticalTasksCount > 0
                      ? "Needs attention"
                      : "On track"}
                  </span>
                </div>

                <h3 className="text-3xl font-serif font-bold text-[#28251d] tracking-tight leading-none">
                  {criticalTasksCount > 0
                    ? `${criticalTasksCount} task${
                        criticalTasksCount > 1 ? "s" : ""
                      } need attention`
                    : "Your deadlines look stable"}
                </h3>

                <p className="text-sm text-[#7a7974] max-w-2xl leading-relaxed">
                  {criticalTasksCount > 0
                    ? "Prahari has identified tasks that may slip without intervention. Review the most critical one and start a rescue plan."
                    : "Your current workload looks manageable. Keep moving through the next steps to stay ahead of deadlines."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {spotlightTask && (
                  <Link
                    to={LockedRoute.RESCUE}
                    state={{ taskId: spotlightTask.taskId }}
                    className="inline-flex items-center justify-center bg-[#01696f] hover:bg-[#005156] text-white text-[11px] font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all shadow-sm hover:-translate-y-0.5 hover:shadow border-none"
                  >
                    <span>Open rescue plan</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                )}

                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-5 py-2.5 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                >
                  Add another task
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 lg:border-l lg:border-[#28251d]/10 lg:pl-8 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#7a7974] block">
                  Overall pressure
                </span>
                <span
                  className={`text-4xl font-serif font-bold tracking-tight block ${
                    criticalTasksCount > 0 ? "text-[#d97706]" : "text-[#01696f]"
                  }`}
                >
                  {criticalTasksCount > 0 ? "High" : "Low"}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="h-2 bg-[#28251d]/5 rounded-full overflow-hidden flex">
                  <div className="w-[15%] bg-emerald-600 h-full"></div>
                  {criticalTasksCount > 0 && (
                    <>
                      <div className="w-[50%] bg-amber-500 h-full border-l border-[#f3f0ec]"></div>
                      <div className="w-[17%] bg-rose-600 h-full border-l border-[#f3f0ec]"></div>
                    </>
                  )}
                  <div className="flex-1"></div>
                </div>

                <div className="flex justify-between text-[10px] text-[#7a7974]">
                  <span>Stable</span>
                  <span>Warning</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          ZONE 3: SPOTLIGHT + NEXT ACTIONS
          ========================================================================= */}
      {tasks.length > 0 && (
        <section id="active-target-and-actions" className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 text-left">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974] pb-1 border-b border-[#28251d]/12">
              Most critical deadline
            </h4>

            {spotlightTask ? (
              <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-6 space-y-5 relative overflow-hidden transition-all hover:border-[#28251d]/25">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#01696f]/3 rounded-bl-full pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#28251d]/8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-[#01696f]/10 text-[#01696f] px-2 py-0.5 rounded-sm inline-block">
                      {spotlightTask.category}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#28251d] tracking-tight">
                      {spotlightTask.title}
                    </h3>
                  </div>

                  <div className="self-start sm:self-auto flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        spotlightTask.priority === "critical"
                          ? "bg-[#dc2626] animate-ping"
                          : "bg-[#d97706]"
                      }`}
                    ></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974]">
                      {spotlightTask.priority} priority
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-[#7a7974]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7a7974]/80">Due</span>
                    <p className="font-semibold text-[#28251d] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#7a7974]" />
                      {formatDeadlineDate(spotlightTask.deadline)}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7a7974]/80">Est. Time</span>
                    <p className="font-semibold text-[#01696f]">
                      {(spotlightTask.estimatedMinutes / 60).toFixed(1)} hours
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7a7974]/80">Next status</span>
                    <p className="font-semibold text-[#28251d]">
                      {spotlightTask.nextActionLabel || "Ready for review"}
                    </p>
                  </div>
                </div>

                {spotlightTask.riskReasonSummary ? (
                  <div className="p-3 bg-[#f9f8f5] border border-[#28251d]/8 rounded-sm space-y-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-medium text-amber-800">
                        Why it’s at risk
                      </span>
                    </div>
                    <p className="text-sm text-[#28251d] leading-relaxed">
                      {spotlightTask.riskReasonSummary}
                    </p>
                    {spotlightTask.nextActionLabel && (
                      <span className="inline-block text-[11px] bg-amber-100 text-amber-900 px-2 py-1 rounded-sm mt-1 font-medium">
                        Suggested next step: {spotlightTask.nextActionLabel}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#f9f8f5] border border-[#28251d]/6 border-dashed rounded-sm text-center text-sm space-y-3">
                    <p className="text-[#7a7974] leading-relaxed">
                      This task has not been reviewed yet. Run an AI check to see
                      what may cause it to slip.
                    </p>
                    <button
                      onClick={() => handleReassessTask(spotlightTask)}
                      disabled={assessingTaskId === spotlightTask.taskId}
                      className="inline-flex items-center gap-1 bg-[#28251d] hover:bg-[#01696f] text-white px-3 py-1.5 text-sm font-medium rounded-sm transition-colors cursor-pointer border-none"
                    >
                      <Sparkles
                        className={`w-3 h-3 ${
                          assessingTaskId === spotlightTask.taskId ? "animate-spin" : ""
                        }`}
                      />
                      <span>
                        {assessingTaskId === spotlightTask.taskId
                          ? "Checking..."
                          : "Run AI check"}
                      </span>
                    </button>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-4">
                  <Link
                    to={LockedRoute.RESCUE}
                    state={{ taskId: spotlightTask.taskId }}
                    className="inline-flex items-center justify-center w-full sm:w-auto bg-[#01696f] hover:bg-[#005156] text-white text-[11px] font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all shadow-sm hover:translate-x-0.5 border-none"
                  >
                    <span>Open rescue plan</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>

                  <button
                    onClick={(e) => handleDeleteTask(spotlightTask.taskId, e)}
                    className="p-3 border border-rose-200 hover:border-rose-400 bg-transparent text-rose-600 hover:text-rose-800 transition-colors rounded-sm cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#7a7974]">No urgent task found.</p>
            )}

            {tasks.length > 1 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974] block">
                  Other tasks ({tasks.length - 1})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tasks
                    .filter((t) => t.taskId !== spotlightTask?.taskId)
                    .slice(0, 4)
                    .map((t) => (
                      <div
                        key={t.taskId}
                        className="bg-white border border-[#28251d]/8 shadow-xs p-3.5 rounded-sm flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-[#28251d] line-clamp-1">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-[#7a7974]">
                            {t.category} · {formatDeadlineDate(t.deadline)}
                          </p>
                        </div>
                        <Link
                          to={LockedRoute.RESCUE}
                          state={{ taskId: t.taskId }}
                          className="p-1.5 hover:bg-[#f3f0ec] rounded-full text-[#01696f]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4 text-left">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974] pb-1 border-b border-[#28251d]/12">
              What to do next
            </h4>

            <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-[#f9f8f5] border border-[#28251d]/8 rounded-sm">
                <button
                  onClick={handleRequestPermissionInline}
                  disabled={permissionState === "granted"}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-none transition-colors ${
                    permissionState === "granted"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#01696f]/10 text-[#01696f] hover:bg-[#01696f]/20 cursor-pointer"
                  }`}
                >
                  {permissionState === "granted" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-[#01696f]" />
                  )}
                </button>
                <div className="space-y-0.5">
                  <p
                    className={`text-sm font-semibold ${
                      permissionState === "granted"
                        ? "text-[#7a7974] line-through"
                        : "text-[#28251d]"
                    }`}
                  >
                    Turn on alerts
                  </p>
                  <p className="text-[11px] text-[#7a7974]">
                    {permissionState === "granted"
                      ? "Deadline alerts are active"
                      : "Get notified when a task becomes urgent"}
                  </p>
                </div>
              </div>

              {spotlightTask && (
                <div className="flex items-start gap-3 p-3 bg-[#f9f8f5] border border-[#28251d]/10 rounded-sm">
                  <button
                    onClick={() => handleReassessTask(spotlightTask)}
                    disabled={
                      assessingTaskId === spotlightTask.taskId ||
                      spotlightTask.riskReasonSummary !== undefined
                    }
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-none transition-all ${
                      spotlightTask.riskReasonSummary
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[#01696f]/10 text-[#01696f] hover:bg-[#01696f]/20 cursor-pointer"
                    }`}
                  >
                    {spotlightTask.riskReasonSummary ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Sparkles
                        className={`w-3.5 h-3.5 text-[#01696f] ${
                          assessingTaskId === spotlightTask.taskId ? "animate-spin" : ""
                        }`}
                      />
                    )}
                  </button>
                  <div className="space-y-0.5">
                    <p
                      className={`text-sm font-semibold ${
                        spotlightTask.riskReasonSummary
                          ? "text-[#7a7974] line-through"
                          : "text-[#28251d]"
                      }`}
                    >
                      Review your most urgent task
                    </p>
                    <p className="text-[11px] text-[#7a7974]">
                      {spotlightTask.riskReasonSummary
                        ? "AI review is complete"
                        : "Run an AI check to understand the risk"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-[#f9f8f5] border border-[#28251d]/10 rounded-sm">
                <div className="w-6 h-6 rounded-full bg-[#01696f]/10 text-[#01696f] flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 text-[#01696f]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-[#28251d]">
                    Start the next rescue step
                  </p>
                  <p className="text-[11px] text-[#7a7974]">
                    Focus on one concrete action instead of the whole task
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          ZONE 4: SECONDARY INSIGHTS
          ========================================================================= */}
      <section id="secondary-insights" className="space-y-4">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974] pb-1 border-b border-[#28251d]/12 text-left">
          Recent activity & workload
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-5 space-y-4 text-left">
            <div className="border-b border-[#28251d]/8 pb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#28251d] tracking-widest flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#7a7974]" />
                Alerts
              </span>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="text-[11px] bg-transparent hover:underline text-[#01696f] hover:text-[#005156] cursor-pointer border-none"
                >
                  Clear all
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <p className="text-sm text-[#7a7974] animate-pulse">
                Checking for new alerts...
              </p>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-sm text-[#7a7974] leading-normal max-w-[220px] mx-auto">
                  No urgent alerts right now. Your tasks are stable.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.notificationId} className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-amber-700">
                        {getFriendlyNotificationType(n.type)}
                      </span>
                      <span className="text-[11px] text-[#7a7974]">
                        {n.createdAt instanceof Timestamp
                          ? new Date(n.createdAt.toMillis()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </span>
                    </div>
                    <p className="text-sm text-[#28251d] leading-relaxed">{n.body}</p>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkNotificationRead(n.notificationId)}
                        className="text-[11px] text-[#01696f] hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-5 space-y-4 text-left">
            <div className="border-b border-[#28251d]/8 pb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#28251d] tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#7a7974]" />
                System readiness
              </span>
            </div>

            <div className="space-y-3 text-sm text-[#7a7974] leading-relaxed">
              <div className="flex gap-2">
                <span className="text-emerald-600 font-bold">●</span>
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#28251d]">Task data is connected</p>
                  <p>Changes are updating normally</p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="text-emerald-600 font-bold">●</span>
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#28251d]">AI planning is available</p>
                  <p>Task risk analysis is ready</p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="text-amber-600 font-bold">●</span>
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#28251d]">Your session is secure</p>
                  <p>You can continue safely</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-5 space-y-4 text-left">
            <div className="border-b border-[#28251d]/8 pb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#28251d] tracking-widest flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-[#7a7974]" />
                Workload summary
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between pb-1 border-b border-[#28251d]/6">
                <span className="text-[#7a7974]">Active tasks</span>
                <span className="font-semibold text-[#28251d]">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-[#28251d]/6">
                <span className="text-[#7a7974]">Estimated work</span>
                <span className="font-semibold text-[#01696f]">
                  {totalEstimatedHours} hours
                </span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-[#28251d]/6">
                <span className="text-[#7a7974]">Completed or stabilized</span>
                <span className="font-semibold text-emerald-700">
                  {stabilizedCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7a7974]">Current state</span>
                <span className="font-semibold text-[#28251d]">
                  {criticalTasksCount > 0 ? "Needs attention" : "On track"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE 5: DEMO SANDBOX
          ========================================================================= */}
      <section id="collapsible-sandbox-wrapper" className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white border border-[#28251d]/12 shadow-sm rounded-sm text-sm">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#01696f]" />
            <span className="font-serif font-bold text-sm text-[#28251d]">
              Demo scenarios
            </span>
          </div>

          <button
            onClick={() => setIsDemoSandboxOpen(!isDemoSandboxOpen)}
            className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-transparent hover:bg-[#28251d]/5 text-[#7a7974] hover:text-[#28251d] border border-[#28251d]/15 hover:border-[#28251d]/35 rounded-sm transition-all cursor-pointer"
          >
            {isDemoSandboxOpen ? "Hide tools" : "Show tools"}
          </button>
        </div>

        {isDemoSandboxOpen && (
          <div className="bg-white border border-[#28251d]/12 shadow-sm rounded-sm p-6 space-y-6 text-left animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <h5 className="text-sm font-semibold text-[#28251d]">
                    Demo controls
                  </h5>
                  <p className="text-sm text-[#7a7974] leading-relaxed">
                    Load realistic sample tasks for your demo and clear them when
                    needed.
                  </p>
                </div>

                {demoMessage && (
                  <div className="p-3 bg-[#28251d] text-white text-sm rounded-sm flex items-center gap-2 animate-fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{demoMessage}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSeedDemo}
                    disabled={demoActionLoading}
                    className="px-5 py-2.5 bg-[#01696f] hover:bg-[#005156] disabled:bg-slate-300 text-white rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed border-none shadow-sm"
                  >
                    {demoActionLoading ? "Loading..." : "Load demo"}
                  </button>

                  <button
                    onClick={handleResetDemo}
                    disabled={demoActionLoading}
                    className="px-5 py-2.5 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    Clear demo
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#f9f8f5] border border-[#28251d]/8 rounded-sm p-4 space-y-3 text-sm">
                <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974]">
                  How Prahari works
                </h5>
                <ul className="space-y-2 text-[#7a7974] leading-relaxed">
                  <li className="flex gap-2 items-start">
                    <span className="font-semibold text-[#28251d] bg-[#f9f8f5] px-1 rounded-sm">
                      1
                    </span>
                    <span>
                      <strong>Risk analysis</strong>: Prahari checks priority, time
                      left, and workload pressure.
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-semibold text-[#28251d] bg-[#f9f8f5] px-1 rounded-sm">
                      2
                    </span>
                    <span>
                      <strong>Recovery planning</strong>: AI turns urgent work into
                      smaller, achievable next steps.
                    </span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-semibold text-[#28251d] bg-[#f9f8f5] px-1 rounded-sm">
                      3
                    </span>
                    <span>
                      <strong>Alerts</strong>: Prahari warns users when a task needs
                      attention.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          MODAL
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#28251d]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#28251d]/12 max-w-md w-full p-6 sm:p-8 rounded-sm shadow-xl space-y-5 animate-slide-up relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-[#28251d]/5 rounded-full text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer border-none bg-transparent"
              title="Close modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1.5 text-left">
              <h3 className="text-xl font-serif font-bold text-[#28251d]">
                Add a deadline
              </h3>
              <p className="text-sm text-[#7a7974]">
                Tell Prahari what needs to be done and when it is due.
              </p>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-medium text-[#7a7974] block">
                  Task title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Finish assignment draft"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-[#28251d] placeholder:text-[#7a7974]/40 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/25 focus:border-[#01696f] rounded-sm focus:ring-0 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[11px] font-medium text-[#7a7974] block">
                  Task details
                </label>
                <textarea
                  placeholder="Add context, blockers, or what still needs to be done..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm text-[#28251d] placeholder:text-[#7a7974]/40 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/25 focus:border-[#01696f] rounded-sm focus:ring-0 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-medium text-[#7a7974] block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#28251d] bg-[#f9f8f5] border border-[#28251d]/12 focus:border-[#01696f] focus:outline-none rounded-sm"
                  >
                    <option value="Compliance">Compliance</option>
                    <option value="Integration">Integration</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Security">Security</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-medium text-[#7a7974] block">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#28251d] bg-[#f9f8f5] border border-[#28251d]/12 focus:border-[#01696f] focus:outline-none rounded-sm"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-medium text-[#7a7974] block">
                    Due date
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#28251d] bg-[#f9f8f5] border border-[#28251d]/12 focus:border-[#01696f] focus:outline-none rounded-sm"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-medium text-[#7a7974] block">
                    Estimated time (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-[#28251d] bg-[#f9f8f5] border border-[#28251d]/12 focus:border-[#01696f] focus:outline-none rounded-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#28251d]/8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#01696f] hover:bg-[#005156] disabled:bg-[#01696f]/40 disabled:cursor-not-allowed text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border-none shadow-sm hover:-translate-y-0.5 hover:shadow"
                >
                  {isSubmitting ? "Saving..." : "Save task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 bg-[#28251d]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#28251d]/12 max-w-sm w-full p-6 rounded-sm shadow-xl space-y-4 animate-slide-up relative">
            <button
              onClick={() => setTaskToDelete(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-[#28251d]/5 rounded-full text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer border-none bg-transparent"
              title="Close modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-2 text-left">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#28251d]">
                Delete Task?
              </h3>
              <p className="text-sm text-[#7a7974] leading-relaxed">
                Are you sure you want to delete this task? This action cannot be undone and will permanently remove this task and its associated plans.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-5 py-2.5 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border-none shadow-sm hover:-translate-y-0.5 hover:shadow"
              >
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;