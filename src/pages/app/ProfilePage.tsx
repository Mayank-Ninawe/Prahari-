import React, { useState, useEffect } from "react";
import { User, Bell, Database, Calendar, ShieldCheck, ShieldAlert, Sparkles, Sliders, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuth } from "../../components/ui/ProtectedRoute";
import { FirebaseService } from "../../services/firebaseService";
import { NotificationService } from "../../services/notificationService";
import { Card, Badge, SectionHeader, Button } from "../../components/ui/BaseComponents";

export function ProfilePage() {
  const { firebaseUser, userDoc, refreshUserDoc, logout } = useAuth();
  
  // Settings bound to Firestore UserDocument
  const [fullName, setFullName] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  const [workStyle, setWorkStyle] = useState("normal");
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [notificationsSupported, setNotificationsSupported] = useState(false);

  // Sync state with loaded userDoc and browser notification support
  useEffect(() => {
    setNotificationsSupported(NotificationService.isSupported());
    setPermissionState(NotificationService.getPermissionState());
  }, []);

  useEffect(() => {
    if (userDoc) {
      setFullName(userDoc.fullName || "");
      setPushEnabled(userDoc.notificationPreferences?.webPush || false);
      setCalendarSync(userDoc.notificationPreferences?.email || false);
      setWorkStyle(userDoc.workStyle || "normal");
    } else if (firebaseUser) {
      setFullName(firebaseUser.displayName || "");
    }
  }, [userDoc, firebaseUser]);

  const handleRequestPermission = async () => {
    const result = await NotificationService.requestPermission();
    setPermissionState(result);
    if (result === "granted") {
      setPushEnabled(true);
      NotificationService.sendLocalBrowserNotification(
        "Prahari AI Notification Engine Activated",
        "You will now receive high-priority escalation and compression warnings in this browser."
      );
    } else if (result === "denied") {
      setPushEnabled(false);
      setError("Notification permission was blocked. Please adjust your browser site preferences to enable alerts.");
    }
  };

  const handleTestNotification = () => {
    NotificationService.sendLocalBrowserNotification(
      "TEST ESCALATION NUDGE - PRAHARI AI",
      "Intervention successful. System tracking status checks are active."
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    
    setSavingSettings(true);
    setSaveSuccess(false);
    setError("");

    try {
      await FirebaseService.updateUserDocument(firebaseUser.uid, {
        fullName,
        notificationPreferences: {
          webPush: pushEnabled,
          email: calendarSync
        },
        workStyle: workStyle as any
      });
      
      // Refresh the context state
      await refreshUserDoc();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error("Error updating configuration:", err);
      setError("Failed to synchronize parameters with Cloud Firestore.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div id="profile-page-root" className="space-y-8 font-sans max-w-4xl mx-auto text-left animate-fade-in">
      
      {/* 1. HEADER HERO */}
      <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-24 opacity-[0.02] bg-[radial-gradient(#0f172a_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>
        
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-sm flex items-center justify-center text-xl font-bold shadow-xs border border-slate-800 shrink-0">
            {(fullName || firebaseUser?.email || "U")[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {fullName || "Workspace User"}
            </h2>
            <p className="text-xs text-slate-500 font-mono tracking-wide uppercase">
              {firebaseUser?.email || "demo@prahari.ai"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider font-mono">
              Live Firestore Sync Active
            </span>
          </div>
          <Button 
            onClick={() => logout()} 
            variant="secondary" 
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-mono text-[9px] font-bold tracking-widest uppercase"
          >
            Sign Out Session
          </Button>
        </div>
      </div>

      {/* Error Indicator */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. FORM AND SYSTEM PARAMETERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Settings Option Panel */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-sm shadow-xs space-y-6">
          <SectionHeader
            title="Rescue settings & protocols"
            subtitle="Configure delivery guard algorithms and alert systems, backed by secure Firestore schemas."
          />

          <div className="space-y-5">
            {/* Field: Full Name */}
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                User Full Name
              </label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full max-w-md px-3 py-2 text-xs text-slate-900 bg-slate-50 hover:bg-slate-50/50 border border-slate-250 focus:border-slate-900 focus:bg-white rounded-xs focus:ring-0 focus:outline-hidden transition-all"
                placeholder="Workspace User"
              />
            </div>

            {/* Field: Work Style (Priority Optimization Mode) */}
            <div className="space-y-1.5 pb-4 border-b border-slate-100">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Rescue Scoping Mode
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {["relaxed", "normal", "aggressive"].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setWorkStyle(style)}
                    className={`px-3 py-2 text-[10px] font-mono font-bold uppercase border rounded-xs transition-all cursor-pointer ${
                      workStyle === style 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-md pt-1">
                {workStyle === "relaxed" && "Relaxed: Keeps milestone buffers wide, maintaining high quality thresholds."}
                {workStyle === "normal" && "Normal: Automatically identifies normal milestone slippages & de-scopes minor targets."}
                {workStyle === "aggressive" && "Aggressive: Forcefully compresses estimates by up to 50%, forcing barebones MVT."}
              </p>
            </div>
            
            {/* Toggle 1: Web Push */}
            <div className="pb-4 border-b border-slate-100 space-y-3.5 text-left">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 max-w-md">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span>Web Alerts & Escalation Notifications</span>
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receive real-time high-urgency alerts directly in your browser when a monitored task crosses high risk thresholds or is overdue for compression.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  disabled={!notificationsSupported || permissionState === "denied"}
                  onChange={(e) => {
                    if (e.target.checked && permissionState !== "granted") {
                      handleRequestPermission();
                    } else {
                      setPushEnabled(e.target.checked);
                    }
                  }}
                  className="w-4.5 h-4.5 text-slate-900 border-slate-200 rounded-sm focus:ring-slate-900 cursor-pointer mt-0.5 disabled:opacity-50"
                />
              </div>

              {/* Permission & Test Controls Panel */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xs flex flex-wrap items-center justify-between gap-3.5">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="text-slate-400">BROWSER PERMISSION:</span>
                  {!notificationsSupported ? (
                    <span className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">NOT SUPPORTED</span>
                  ) : permissionState === "granted" ? (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">AUTHORIZED</span>
                  ) : permissionState === "denied" ? (
                    <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">BLOCKED</span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">NOT REQUESTED</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {notificationsSupported && permissionState === "default" && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                    >
                      Authorize Alerts
                    </button>
                  )}
                  {notificationsSupported && permissionState === "granted" && (
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="px-3 py-1 border border-slate-250 hover:border-slate-950 bg-white text-slate-700 hover:text-slate-950 rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                    >
                      Test Alert
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle 2: Calendar Integration */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-md">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Google Calendar Sync</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatically export generated critical task paths to secure team execution slots on your Google Calendar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={calendarSync}
                onChange={(e) => setCalendarSync(e.target.checked)}
                className="w-4.5 h-4.5 text-slate-900 border-slate-200 rounded-sm focus:ring-slate-900 cursor-pointer mt-0.5"
              />
            </div>

          </div>

          <div className="pt-6 border-t border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="h-6">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> CONFIG SYNCHRONIZED WITH FIRESTORE
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={savingSettings}
              variant="primary"
              className="font-mono text-[10px] font-bold tracking-wider uppercase py-2 px-4"
              icon={<RefreshCw className={`w-3.5 h-3.5 text-white ${savingSettings ? "animate-spin" : ""}`} />}
            >
              {savingSettings ? "Synchronizing..." : "Save Config Parameters"}
            </Button>
          </div>
        </form>

        {/* Right Side: Core Integrations Index */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-sm shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-950 flex items-center gap-1.5">
                <Database className="w-4.5 h-4.5 text-slate-700" />
                <span>Integration Index</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Current system connection states in the active Prahari container environment.</p>
            </div>

            <div className="space-y-4">
              
              {/* Firebase auth */}
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">Firebase Auth</span>
                  <Badge urgency="low">ACTIVE</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Real Email/Password authentication active. Active session is scoped to <span className="font-semibold text-slate-800">{firebaseUser?.email}</span>.
                </p>
              </div>

              {/* Firestore DB */}
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">Cloud Firestore</span>
                  <Badge urgency="low">CONNECTED</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Real-time database connection is open and validated under deployed user secure rules.
                </p>
              </div>

              {/* Gemini Flash */}
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">Gemini Models</span>
                  <Badge urgency="high">STANDBY</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The @google/genai TypeScript SDK is configured. Code logic is ready to be linked in the Phase 6 update.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono select-none">
            <span>SECURE PRAHARI ACTIVE</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;
