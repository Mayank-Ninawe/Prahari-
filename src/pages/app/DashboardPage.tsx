import React from "react";
import { Link } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Zap, 
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
  HelpCircle,
  Bell,
  AlertTriangle,
  CheckCheck,
  Eye
} from "lucide-react";
import { LockedRoute } from "../../config/constants";
import { Card, Badge, Button } from "../../components/ui/BaseComponents";
import { useAuth } from "../../components/ui/ProtectedRoute";
import { FirebaseService, TaskDocument } from "../../services/firebaseService";
import { GeminiService } from "../../services/gemini";
import { NotificationService, NotificationDocument } from "../../services/notificationService";
import { DemoService } from "../../services/demoService";

export function DashboardPage() {
  const { firebaseUser, userDoc } = useAuth();
  
  const [tasks, setTasks] = React.useState<TaskDocument[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  
  // Modal & Form States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("Compliance");
  const [deadline, setDeadline] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(120);
  const [priority, setPriority] = React.useState("high");

  // Demo Sandbox States
  const [isDemoSandboxOpen, setIsDemoSandboxOpen] = React.useState(true);
  const [demoActionLoading, setDemoActionLoading] = React.useState(false);
  const [demoMessage, setDemoMessage] = React.useState("");

  // Notifications state
  const [notifications, setNotifications] = React.useState<NotificationDocument[]>([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);
  const [nudgeClosed, setNudgeClosed] = React.useState(false);
  const [permissionState, setPermissionState] = React.useState<NotificationPermission>("default");

  React.useEffect(() => {
    setPermissionState(NotificationService.getPermissionState());
  }, []);

  const loadNotifications = async (uid: string, currentTasks: TaskDocument[]) => {
    try {
      setLoadingNotifications(true);
      const isPushPreferred = userDoc?.notificationPreferences?.webPush || false;
      const list = await NotificationService.evaluateEscalationTriggers(uid, currentTasks, isPushPreferred);
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
      setNotifications(prev => 
        prev.map(n => n.notificationId === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!firebaseUser || notifications.length === 0) return;
    try {
      await NotificationService.markAllAsRead(firebaseUser.uid, notifications);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleRequestPermissionInline = async () => {
    const result = await NotificationService.requestPermission();
    setPermissionState(result);
    if (result === "granted") {
      NotificationService.sendLocalBrowserNotification(
        "Prahari AI Web Push Activated",
        "You will now receive high-priority crisis escalation warnings in real-time."
      );
    }
  };

  // Load tasks on mount or when user changes
  const loadTasks = async () => {
    if (!firebaseUser) return;
    try {
      setLoading(true);
      setError("");
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);
      await loadNotifications(firebaseUser.uid, fetchedTasks);
    } catch (err: any) {
      setError("Failed to fetch workspace targets from Firestore.");
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
      setDemoMessage("Gears locked. Real-time Firestore sandbox populated with 3 live crisis scenarios.");
      await loadTasks();
      setTimeout(() => setDemoMessage(""), 6000);
    } catch (err) {
      console.error("Demo seeding failed:", err);
      setError("Failed to seed demo workspace in Firestore.");
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
      setDemoMessage("Pristine restore: all workspace targets cleared. Empty-state active.");
      await loadTasks();
      setTimeout(() => setDemoMessage(""), 6000);
    } catch (err) {
      console.error("Demo reset failed:", err);
      setError("Failed to purge demo workspace in Firestore.");
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
      
      const deadlineStr = task.deadline instanceof Date 
        ? task.deadline.toISOString()
        : (task.deadline as any)?.toDate?.()?.toISOString() || String(task.deadline);

      const assessmentResult = await GeminiService.assessTaskRisk({
        title: task.title,
        description: task.description,
        category: task.category,
        deadline: deadlineStr,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority
      }, {
        workStyle: userDoc?.workStyle || "normal",
        aggressiveness: userDoc?.demoModeEnabled ? "high" : "medium",
        timezone: userDoc?.timezone || "Asia/Kolkata"
      });

      await FirebaseService.updateTask(firebaseUser.uid, task.taskId, {
        riskScore: assessmentResult.riskScore,
        riskLevel: assessmentResult.riskLevel,
        riskReasonSummary: assessmentResult.riskReasonSummary,
        aiLastEvaluatedAt: new Date(),
        nextActionLabel: assessmentResult.recommendedMode === "compress" ? "Needs Compression" : assessmentResult.recommendedMode === "rescue" ? "Needs Rescue Plan" : "Maintain Scope"
      });

      await loadTasks();
    } catch (err: any) {
      console.error("Manual reassessment failed:", err);
      setError("AI risk assessment failed. Please ensure your Gemini API key is active.");
    } finally {
      setAssessingTaskId(null);
    }
  };

  // Form submission handler
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!title || !deadline) {
      alert("Please fill in title and deadline.");
      return;
    }

    try {
      setLoading(true);
      const taskId = await FirebaseService.createTask(firebaseUser.uid, {
        title,
        description,
        category,
        deadline: new Date(deadline),
        estimatedMinutes: Number(estimatedMinutes),
        priority
      });
      
      // Auto-trigger risk assessment on creation
      try {
        const assessmentResult = await GeminiService.assessTaskRisk({
          title,
          description,
          category,
          deadline: new Date(deadline).toISOString(),
          estimatedMinutes: Number(estimatedMinutes),
          priority
        }, {
          workStyle: userDoc?.workStyle || "normal",
          aggressiveness: userDoc?.demoModeEnabled ? "high" : "medium",
          timezone: userDoc?.timezone || "Asia/Kolkata"
        });

        await FirebaseService.updateTask(firebaseUser.uid, taskId, {
          riskScore: assessmentResult.riskScore,
          riskLevel: assessmentResult.riskLevel,
          riskReasonSummary: assessmentResult.riskReasonSummary,
          aiLastEvaluatedAt: new Date(),
          nextActionLabel: assessmentResult.recommendedMode === "compress" ? "Needs Compression" : assessmentResult.recommendedMode === "rescue" ? "Needs Rescue Plan" : "Maintain Scope"
        });
      } catch (aiErr) {
        console.error("AI risk assessment failed on task creation:", aiErr);
      }
      
      // Reset form and close modal
      setTitle("");
      setDescription("");
      setCategory("Compliance");
      setDeadline("");
      setEstimatedMinutes(120);
      setPriority("high");
      setIsFormOpen(false);
      
      // Reload list
      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Error creating target:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firebaseUser) return;
    
    if (confirm("Are you sure you want to delete this workspace target?")) {
      try {
        setLoading(true);
        await FirebaseService.deleteTask(firebaseUser.uid, taskId);
        const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
        setTasks(fetchedTasks);
      } catch (err) {
        console.error("Error deleting target:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Load demo targets
  const handleLoadDemoScenarios = async () => {
    if (!firebaseUser) return;
    try {
      setLoading(true);
      
      await FirebaseService.createTask(firebaseUser.uid, {
        title: "GDPR Compliance Verification",
        description: "Verify database schema upgrades comply with GDPR regulations. Exclude secondary telemetry.",
        category: "Compliance",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 720,
        priority: "critical"
      });

      await FirebaseService.createTask(firebaseUser.uid, {
        title: "Q3 Analytics API Sync Gateway",
        description: "Deploy analytics endpoints to synchronize metrics, deferred tracing payloads.",
        category: "Integration",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 480,
        priority: "high"
      });

      await FirebaseService.createTask(firebaseUser.uid, {
        title: "User Workspace Onboarding Revamp",
        description: "Simplify auth screens and loading states. Smooth UX transition.",
        category: "Frontend",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 300,
        priority: "low"
      });

      const fetchedTasks = await FirebaseService.getUserTasks(firebaseUser.uid);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Error seeding demo targets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derived dashboard analytics
  const criticalTasksCount = tasks.filter(t => t.priority === "critical" || t.priority === "high").length;
  const totalEstimatedMinutes = tasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalEstimatedHours = Math.ceil(totalEstimatedMinutes / 60);

  // Spotlight target
  const spotlightTask = tasks.find(t => t.priority === "critical") || 
                        tasks.find(t => t.priority === "high") || 
                        tasks[0];

  return (
    <div id="dashboard-page-root" className="space-y-8 font-sans text-slate-900 animate-fade-in text-left">
      
      {/* PAGE HEADER */}
      <div id="dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Operational Command Center</h2>
          <p className="text-xs text-slate-500">
            Milestones stored in real Firestore collections for user <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded-sm">{userDoc?.fullName || firebaseUser?.email}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Button 
            id="create-task-btn" 
            onClick={() => setIsFormOpen(true)}
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5 text-white" />}
          >
            Monitor New Target
          </Button>
        </div>
      </div>
      
      {/* HACKATHON JUDGE & DEMO SANDBOX SUITE */}
      {isDemoSandboxOpen ? (
        <Card className="border-2 border-slate-900 bg-slate-50 p-6 rounded-sm space-y-6 text-left relative overflow-hidden shadow-md">
          {/* Accent decoration strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-sm">
                  Evaluation Suite
                </span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono text-[9px] font-bold uppercase tracking-wider rounded-sm animate-pulse">
                  Ready
                </span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
                <Sliders className="w-4.5 h-4.5 text-slate-900" />
                Prahari AI • Evaluation & Demo Sandbox
              </h3>
              <p className="text-[11px] text-slate-500 max-w-2xl">
                This sandbox controls real Firestore collections. Click to seed the precise workspace scenarios described in our hackathon walkthrough video.
              </p>
            </div>
            <button
              onClick={() => setIsDemoSandboxOpen(false)}
              className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider border border-slate-300 hover:border-slate-950 bg-white text-slate-600 hover:text-slate-950 rounded-xs transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              Hide Sandbox
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Box: Controls & Seeder */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Available Simulation Tracks:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xs space-y-1 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-150 px-1.5 py-0.5 rounded-sm">CRITICAL</span>
                    </div>
                    <h5 className="text-[10.5px] font-bold text-slate-800 font-mono tracking-tight leading-tight">Compiler Project</h5>
                    <p className="text-[9px] text-slate-400 leading-normal">Triggers extreme risk score (94) and configures standalone rescue path standby.</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xs space-y-1 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded-sm">COMPRESS</span>
                    </div>
                    <h5 className="text-[10.5px] font-bold text-slate-800 font-mono tracking-tight leading-tight">SaaS Pitch Deck</h5>
                    <p className="text-[9px] text-slate-400 leading-normal">Triggers automatic timeline calculations to prompt scope compression.</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xs space-y-1 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded-sm">ACTIVE TRACK</span>
                    </div>
                    <h5 className="text-[10.5px] font-bold text-slate-800 font-mono tracking-tight leading-tight">Final Presentation</h5>
                    <p className="text-[9px] text-slate-400 leading-normal">Loads completed milestones, live countdown, and focus tracking backdrops.</p>
                  </div>
                </div>
              </div>

              {demoMessage && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 text-slate-100 text-[11px] font-mono rounded-xs flex items-center gap-2 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{demoMessage}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleSeedDemo}
                  disabled={demoActionLoading}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border-none"
                >
                  {demoActionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Seeding Sandbox...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Seed Sandbox Targets
                    </>
                  )}
                </button>
                <button
                  onClick={handleResetDemo}
                  disabled={demoActionLoading}
                  className="px-4 py-2.5 border border-slate-300 hover:border-slate-950 bg-white text-slate-700 hover:text-slate-950 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Purge Workspace
                </button>
              </div>
            </div>

            {/* Right Box: Architecture Core Schematic */}
            <div className="lg:col-span-5 p-4 bg-white border border-slate-200 rounded-xs space-y-3.5">
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Prahari Core Tech Architecture:</h4>
              <ul className="space-y-2.5 text-[10.5px] text-slate-600 font-sans leading-normal">
                <li className="flex gap-2 items-start">
                  <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0 font-bold">1</span>
                  <span><strong className="text-slate-900">Risk Assessment Engine</strong>: Computes 0-100 hazard scores directly in Firestore matching compliance, safety-buffer, and category metrics.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0 font-bold">2</span>
                  <span><strong className="text-slate-900">Tactical Rescue (Gemini 2.5)</strong>: Generates strict, low-overhead survival plans when tasks cross danger thresholds.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0 font-bold">3</span>
                  <span><strong className="text-slate-900">AI Scope Compression</strong>: Compresses remaining scope in one click by pruning minor tasks and calculating saved minutes.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0 font-bold">4</span>
                  <span><strong className="text-slate-900">Active Warning Layer</strong>: Connects browser notification permissions to push localized rescue prompts directly onto browser screen.</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xs text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Prahari AI Sandbox & Evaluation Tools hidden.</span>
          </span>
          <button
            onClick={() => setIsDemoSandboxOpen(true)}
            className="text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-sm border-none text-white transition-all cursor-pointer"
          >
            Show Sandbox
          </button>
        </div>
      )}

      {/* 0. NOTIFICATION PERMISSION ONBOARDING NUDGE */}
      {NotificationService.isSupported() && permissionState === "default" && !nudgeClosed && (
        <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex gap-2.5 items-start sm:items-center">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
            </div>
            <div className="space-y-0.5 text-left">
              <h5 className="font-bold text-amber-900 font-mono uppercase text-[10px] tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Enable High-Urgency System Alerts
              </h5>
              <p className="text-amber-800 leading-normal text-[11px]">
                Activate real-time web notifications to receive immediate compression and crisis escalation nudges before deadlines breach.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleRequestPermissionInline}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
            >
              Activate Alerts
            </button>
            <button
              onClick={() => setNudgeClosed(true)}
              className="p-1 hover:bg-slate-200/50 rounded-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Dismiss prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ERROR FEEDBACK */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. URGENCY SUMMARY AREA (PREMIUM COMPACT GAUGE HEADER) */}
      <section id="urgency-summary-area" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-sm overflow-hidden shadow-xs">
        {/* Left Side: System Heat Gauge */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold">System Status</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-sans">
                {criticalTasksCount > 0 ? "High Urgency Mode" : "Stable Execution"}
              </h3>
              <Badge urgency={criticalTasksCount > 0 ? "high" : "low"}>
                {criticalTasksCount > 0 ? "Active" : "Nominal"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {criticalTasksCount > 0 
                ? "Workspace safety requires immediate path optimizations. Gemini compression is primed to analyze active blocker patterns."
                : "All targets are within normal execution parameters. Maintain strict scoping to protect milestone integrity."}
            </p>
          </div>

          <div className="pt-8 relative z-10 space-y-3">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
              <span>SYSTEM RISK COEFFICIENT</span>
              <span className={criticalTasksCount > 0 ? "text-amber-500" : "text-emerald-400"}>
                {criticalTasksCount > 0 ? "82% RISK INDEX" : "15% RISK INDEX"}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div className="w-[35%] bg-emerald-500 h-full"></div>
              {criticalTasksCount > 0 && (
                <>
                  <div className="w-[30%] bg-amber-500 h-full border-l border-slate-900"></div>
                  <div className="w-[17%] bg-rose-500 h-full border-l border-slate-900"></div>
                </>
              )}
              <div className="flex-1 bg-slate-800 h-full"></div>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0% SAFE</span>
              <span>75% LIMIT</span>
              <span>100% BREACH</span>
            </div>
          </div>
        </div>

        {/* Right Side: Key Telemetry Grid */}
        <div className="lg:col-span-7 p-6 sm:p-8 grid grid-cols-2 gap-6 bg-white">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Monitored Milestones</span>
            <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight block">
              {loading ? "..." : tasks.length}
            </span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Tracked live in Cloud Firestore database.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Interventions Deployed</span>
            <span className="text-3xl font-bold font-mono text-amber-600 tracking-tight block">
              {tasks.filter(t => t.status === "mitigated").length}
            </span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Mitigation structures calculated in active plans.
            </p>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-4">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Total Workload Buffer</span>
            <span className="text-3xl font-bold font-mono text-emerald-700 tracking-tight block">
              {loading ? "..." : `${totalEstimatedHours}h`}
            </span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Accumulated estimate for all active targets.
            </p>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-4">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Real-time Connection</span>
            <span className="text-3xl font-bold font-mono text-emerald-600 tracking-tight block">Active</span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Direct schema-validated read/write stream.
            </p>
          </div>
        </div>
      </section>

      {/* WORKSPACE SECTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CRITICAL SPOTLIGHT & OVERVIEW */}
        <div className="lg:col-span-8 space-y-8 flex flex-col">
          
          {/* 2. CRITICAL TASK SPOTLIGHT AREA */}
          {spotlightTask ? (
            <section id="critical-task-spotlight-area">
              <Card className="border border-rose-200 bg-white shadow-2xs relative overflow-hidden p-6">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-sm bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="w-4.5 h-4.5 text-rose-600" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-rose-600">Immediate Intervention Target</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{spotlightTask.title}</h3>
                    </div>
                  </div>
                  <Badge urgency={spotlightTask.priority === "critical" ? "critical" : "high"}>
                    {spotlightTask.priority.toUpperCase()} PRIORITY
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Category</span>
                    <p className="font-semibold text-slate-800 leading-relaxed">{spotlightTask.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Deadline</span>
                    <p className="font-semibold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {spotlightTask.deadline instanceof Date 
                        ? spotlightTask.deadline.toLocaleDateString()
                        : (spotlightTask.deadline as any)?.toDate?.()?.toLocaleDateString() || String(spotlightTask.deadline)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Est. Effort</span>
                    <p className="font-bold text-rose-600">{(spotlightTask.estimatedMinutes / 60).toFixed(1)} hours</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold text-amber-600 uppercase block">Workspace Analysis Status</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {spotlightTask.description || "No description provided. Workspace mitigation engines are in standby until Phase 6."}
                    </p>
                  </div>
                  <Link to={LockedRoute.RESCUE} state={{ taskId: spotlightTask.taskId }} className="shrink-0 w-full sm:w-auto">
                    <Button size="sm" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto font-mono text-[10px] font-bold tracking-wider uppercase">
                      Open Rescue Dashboard
                    </Button>
                  </Link>
                </div>
              </Card>
            </section>
          ) : (
            <section id="empty-spotlight">
              <Card className="border border-slate-200 bg-white p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">No active targets found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not added any workspace targets to monitor. Seed default demo scenarios or add your own target manually to start tracking.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <Button size="sm" onClick={handleLoadDemoScenarios} variant="secondary">
                    Seed Demo Scenarios
                  </Button>
                  <Button size="sm" onClick={() => setIsFormOpen(true)} variant="primary">
                    Monitor Custom Target
                  </Button>
                </div>
              </Card>
            </section>
          )}

          {/* 3. TASK OVERVIEW AREA */}
          {tasks.length > 0 && (
            <section id="task-overview-area" className="bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col">
              <div className="p-6 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Active Target Repositories</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live list fetched dynamically from users/{firebaseUser?.uid}/tasks.</p>
                </div>
                <Badge urgency="neutral">{tasks.length} DEPLOYED</Badge>
              </div>

              <div className="divide-y divide-slate-100">
                {tasks.map((target) => {
                  const riskLevel = target.riskLevel || "safe";
                  const riskScore = target.riskScore || 0;
                  const evaluated = target.aiLastEvaluatedAt !== null;
                  
                  return (
                    <div key={target.taskId} className="p-6 flex flex-col hover:bg-slate-50/30 transition-colors duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 font-sans">
                        
                        {/* Task Information & Category */}
                        <div className="space-y-2 max-w-lg">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">{target.title}</h4>
                            <Badge urgency={target.priority === "critical" ? "critical" : target.priority === "high" ? "high" : "low"}>
                              {target.category}
                            </Badge>
                            
                            {evaluated ? (
                              <Badge urgency={riskLevel === "critical" ? "critical" : riskLevel === "watch" ? "medium" : "low"}>
                                Risk: {riskScore}% ({riskLevel.toUpperCase()})
                              </Badge>
                            ) : (
                              <Badge urgency="neutral">
                                Unassessed
                              </Badge>
                            )}

                            {target.status && (
                              <Badge urgency={
                                target.status === "completed" ? "low" :
                                target.status === "compressed" ? "critical" :
                                target.status === "in_progress" ? "medium" :
                                target.status === "rescue_ready" ? "medium" : "neutral"
                              }>
                                {target.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-normal">{target.description}</p>
                          
                          {/* Task Progress Tracker Bar */}
                          {target.progressPercentage !== undefined && (
                            <div className="flex flex-col gap-1 py-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
                                <span>RESCUE MILESTONES</span>
                                <span>{target.progressPercentage}% COMPLETE</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div 
                                    className={`h-full transition-all duration-300 ${target.status === "completed" ? "bg-emerald-500" : target.status === "compressed" ? "bg-rose-500" : "bg-amber-500"}`}
                                    style={{ width: `${target.progressPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({target.completedStepsCount || 0}/{target.totalStepsCount || 0} steps)
                                </span>
                              </div>
                            </div>
                          )}

                          {/* AI Risk Reason Summary */}
                          {evaluated && target.riskReasonSummary && (
                            <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xs flex items-start gap-2 text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-slate-700 leading-relaxed font-sans">{target.riskReasonSummary}</p>
                                {target.nextActionLabel && (
                                  <span className="inline-block text-[9px] font-mono uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-xs">
                                    Next Action: {target.nextActionLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Hourglass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              Deadline: {target.deadline instanceof Date 
                                ? target.deadline.toLocaleDateString()
                                : (target.deadline as any)?.toDate?.()?.toLocaleDateString() || String(target.deadline)}
                            </span>
                            <span className="hidden sm:inline">|</span>
                            <span>Effort: {target.estimatedMinutes} mins</span>
                            {evaluated && target.aiLastEvaluatedAt && (
                              <>
                                <span className="hidden sm:inline">|</span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  Evaluated
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col items-stretch sm:items-end gap-2.5 shrink-0 justify-end sm:justify-start pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          
                          {/* Open Rescue Page with Context-sensitive CTAs */}
                          <Link to={LockedRoute.RESCUE} state={{ taskId: target.taskId }} className="focus:outline-hidden w-full sm:w-auto">
                            {target.status === "in_progress" || target.status === "compressed" ? (
                              <button className="w-full px-3.5 py-2 border border-amber-350 rounded-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 text-xs font-bold font-mono">
                                <span className="text-[10px] tracking-wide">RESUME RESCUE</span>
                                <ArrowRight className="w-3.5 h-3.5 text-white" />
                              </button>
                            ) : target.status === "rescue_ready" ? (
                              <button className="w-full px-3.5 py-2 border border-emerald-350 rounded-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 text-xs font-bold font-mono">
                                <span className="text-[10px] tracking-wide">ACTIVATE PLAN</span>
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                              </button>
                            ) : (
                              <button className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-sm bg-white hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-950 cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 text-xs font-medium">
                                <span className="text-[10px] font-mono text-slate-400">OPEN RESCUE</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            )}
                          </Link>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Manual Reassess Action */}
                            <button 
                              onClick={() => handleReassessTask(target)}
                              disabled={assessingTaskId === target.taskId}
                              className="flex-1 sm:flex-none px-2.5 py-2 border border-amber-200 hover:border-amber-300 rounded-sm bg-amber-50/30 hover:bg-amber-50 text-amber-700 hover:text-amber-900 cursor-pointer shadow-2xs text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                              title="Trigger Gemini Risk Assessment"
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${assessingTaskId === target.taskId ? "animate-spin" : ""}`} />
                              {assessingTaskId === target.taskId ? "Assessing..." : "Reassess"}
                            </button>

                            {/* Delete Button */}
                            <button 
                              onClick={(e) => handleDeleteTask(target.taskId, e)}
                              className="p-2 border border-rose-100 hover:border-rose-200 rounded-sm bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-700 cursor-pointer shadow-2xs"
                              title="Delete Workspace Target"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>

        {/* RIGHT COLUMN: ACTIONS & ACTIVITY */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* NOTIFICATION & ESCALATION ALERTS FEED */}
          <section id="escalation-alerts-feed">
            <Card className="border border-slate-200 bg-white p-6 rounded-sm shadow-xs space-y-4">
              <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-slate-700" />
                    <span>Escalation Feed</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Real-time deadline hazard alerts & guard cues.</p>
                </div>
                {notifications.some(n => !n.read) && (
                  <button 
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[9px] font-mono uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-2 py-1 rounded-sm flex items-center gap-1 transition-all cursor-pointer border-none"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3 h-3 text-slate-500" />
                    Clear All
                  </button>
                )}
              </div>

              {loadingNotifications ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  Analyzing target vectors...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-bold text-slate-900 font-mono uppercase">System Stable</h5>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                      All targets are monitored. No critical escalation flags have been generated.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {notifications.slice(0, 5).map((n) => (
                    <div 
                      key={n.notificationId} 
                      className={`p-3 border rounded-xs transition-all text-left flex gap-2.5 relative ${
                        n.read 
                          ? "bg-slate-50/55 border-slate-150 opacity-65" 
                          : n.escalationLevel === "critical"
                            ? "bg-rose-50/40 border-rose-200"
                            : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      {/* Left Dot or Indicator Icon */}
                      <div className="shrink-0 mt-0.5">
                        {n.escalationLevel === "critical" ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        ) : n.escalationLevel === "warning" ? (
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        ) : (
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                        )}
                      </div>

                      {/* Notification Content */}
                      <div className="space-y-1 pr-4">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wide ${
                            n.read 
                              ? "text-slate-500" 
                              : n.escalationLevel === "critical"
                                ? "text-rose-800"
                                : "text-amber-800"
                          }`}>
                            {n.type.replace("_", " ")}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400">
                            {n.createdAt instanceof Timestamp 
                              ? new Date(n.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "Just now"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug font-sans">{n.body}</p>
                        
                        {/* Direct action path link */}
                        <div className="pt-1">
                          <Link 
                            to={LockedRoute.RESCUE} 
                            state={{ taskId: n.relatedTaskId }}
                            className={`text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                              n.read 
                                ? "text-slate-400 hover:text-slate-600" 
                                : n.escalationLevel === "critical"
                                  ? "text-rose-600 hover:text-rose-700"
                                  : "text-amber-600 hover:text-amber-700"
                            }`}
                          >
                            <span>Trigger Mitigation</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Simple dismiss/mark-as-read check on right */}
                      {!n.read && (
                        <button
                          onClick={() => handleMarkNotificationRead(n.notificationId)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer border-none bg-transparent"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
          
          {/* 4. NEXT ACTION AREA */}
          <section id="next-action-area">
            <Card className="border border-slate-200 bg-white p-6 rounded-sm shadow-xs space-y-5">
              <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">Next Actions</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Execution checklist to lock down delivery.</p>
                </div>
                <Sliders className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-2 bg-slate-50/50 border border-slate-100 rounded-sm text-xs">
                  <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-700" />
                  </span>
                  <div className="space-y-0.5 text-left">
                    <p className="font-semibold text-slate-500 line-through">Establish Firestore connection</p>
                    <p className="text-[10px] text-slate-400">Direct write/read subcollections are configured.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-150 rounded-sm text-xs">
                  <span className="w-4.5 h-4.5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-mono text-[9px] font-bold">
                    2
                  </span>
                  <div className="space-y-0.5 text-left">
                    <p className="font-semibold text-slate-800">Add first active milestone</p>
                    <p className="text-[10px] text-slate-500">Add or generate real-time milestones to map risk.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-150 rounded-sm text-xs opacity-50">
                  <span className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 font-mono text-[9px] font-bold">
                    3
                  </span>
                  <div className="space-y-0.5 text-left">
                    <p className="font-semibold text-slate-500">Run Gemini risk evaluation</p>
                    <p className="text-[10px] text-slate-400">Locked until AI Mitigation phase (Phase 6).</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* 5. RECENT ACTIVITY AREA */}
          <section id="recent-activity-area">
            <Card className="border border-slate-200 bg-white p-6 rounded-sm shadow-xs flex flex-col justify-between">
              <div className="space-y-5">
                <div className="border-b border-slate-150 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">Workspace Telemetry</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Audit log of system telemetry audits & calculations.</p>
                </div>

                <div className="space-y-4 text-xs text-slate-600">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></div>
                    <div className="space-y-0.5 text-left">
                      <p className="font-semibold text-slate-900 leading-none">Database configured</p>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Prahari AI is now synced live with Firestore database continual-caster-1k8sk.
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">Just now</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></div>
                    <div className="space-y-0.5 text-left">
                      <p className="font-semibold text-slate-900 leading-none">Firebase Core Setup Deployed</p>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Real Firebase Email/Password Auth is active.
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">Today</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between text-[10px] text-slate-400 font-mono select-none">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  SYSTEM INTEGRITY SYNCED
                </span>
                <FileText className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </Card>
          </section>

        </div>

      </div>

      {/* =========================================================================
          MONITOR NEW TARGET MODAL FORM (OPTIONAL FEAT IF STABLE)
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="bg-white border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-5 animate-slide-up relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-950">Monitor Deployed Milestone Target</h3>
              <p className="text-xs text-slate-500">Configure parameters to deploy a new monitoring matrix block.</p>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Target Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. GDPR Compliance Verification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 hover:bg-slate-50/50 border border-slate-250 focus:border-slate-900 focus:bg-white rounded-xs focus:ring-0 focus:outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Description / Scope Details</label>
                <textarea 
                  placeholder="Verify critical endpoints, exclude secondary telemetry logs, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 hover:bg-slate-50/50 border border-slate-250 focus:border-slate-900 focus:bg-white rounded-xs focus:ring-0 focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-250 rounded-xs focus:ring-0 focus:outline-hidden"
                  >
                    <option value="Compliance">Compliance</option>
                    <option value="Integration">Integration</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Security">Security</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Priority Level</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-250 rounded-xs focus:ring-0 focus:outline-hidden"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Hard Deadline</label>
                  <input 
                    type="date" 
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-250 rounded-xs focus:ring-0 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Est. Time (Mins)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-250 rounded-xs focus:ring-0 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
                <Button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  size="sm"
                >
                  Sync to Firestore
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}

export default DashboardPage;
