import React, { useState } from "react";
import { User, Bell, Database, Calendar, ShieldCheck, ShieldAlert, Sparkles, Sliders, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../components/ui/ProtectedRoute";
import { Card, Badge, SectionHeader, Button } from "../../components/ui/BaseComponents";

export function ProfilePage() {
  const { user, logout } = useAuth();
  
  // Settings toggle states
  const [pushEnabled, setPushEnabled] = useState(false);
  const [calendarSync, setCalendarSync] = useState(true);
  const [strictScoping, setStrictScoping] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);

    // Simulate network save delay
    setTimeout(() => {
      setSavingSettings(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 800);
  };

  return (
    <div id="profile-page-root" className="space-y-8 font-sans max-w-4xl mx-auto text-left animate-fade-in">
      
      {/* 1. HEADER HERO */}
      <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute inset-y-0 right-0 w-24 opacity-[0.02] bg-[radial-gradient(#0f172a_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>
        
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-sm flex items-center justify-center text-xl font-bold shadow-xs border border-slate-800 shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{user?.name || "Workspace User"}</h2>
            <p className="text-xs text-slate-500 font-mono tracking-wide uppercase">{user?.email || "demo@prahari.ai"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
            Simulated Auth Session Active
          </span>
        </div>
      </div>

      {/* 2. FORM AND SYSTEM PARAMETERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Settings Option Panel */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 bg-white border border-slate-200 p-6 sm:p-8 rounded-sm shadow-xs space-y-6">
          <SectionHeader
            title="Rescue settings & protocols"
            subtitle="Configure delivery guard algorithms and alert systems."
          />

          <div className="space-y-6">
            
            {/* Toggle 1: Web Push */}
            <div className="flex items-start justify-between gap-6 pb-4 border-b border-slate-100">
              <div className="space-y-1 max-w-md">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span>Web Push Alerts (FCM)</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Receive real-time high-urgency notifications directly in your browser when a monitored target crosses critical risk thresholds.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="w-4.5 h-4.5 text-slate-900 border-slate-200 rounded-sm focus:ring-slate-900 cursor-pointer mt-0.5"
              />
            </div>

            {/* Toggle 2: Calendar Integration */}
            <div className="flex items-start justify-between gap-6 pb-4 border-b border-slate-100">
              <div className="space-y-1 max-w-md">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>GSuite Calendar Sync</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatically export generated critical task paths to secure team execution slots on your Google Calendar calendars.
                </p>
              </div>
              <input
                type="checkbox"
                checked={calendarSync}
                onChange={(e) => setCalendarSync(e.target.checked)}
                className="w-4.5 h-4.5 text-slate-900 border-slate-200 rounded-sm focus:ring-slate-900 cursor-pointer mt-0.5"
              />
            </div>

            {/* Toggle 3: Aggressive Scope Compression */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-md">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <span>Aggressive Scope Compression</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Force the Prahari calculation engine to compress estimates by up to 50%, prioritizing barebones functional deliveries first.
                </p>
              </div>
              <input
                type="checkbox"
                checked={strictScoping}
                onChange={(e) => setStrictScoping(e.target.checked)}
                className="w-4.5 h-4.5 text-slate-900 border-slate-200 rounded-sm focus:ring-slate-900 cursor-pointer mt-0.5"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="h-6">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> CONFIG SYNCHRONIZED
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={savingSettings}
              variant="primary"
            >
              {savingSettings ? "Synchronizing settings..." : "Save Config Parameters"}
            </Button>
          </div>
        </form>

        {/* Right Side: Core Integrations Index */}
        <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-950 flex items-center gap-1.5">
                <Database className="w-4.5 h-4.5 text-slate-700" />
                <span>Integration Index</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Current system connection states within the Phase 2 layout.</p>
            </div>

            <div className="space-y-4">
              
              {/* Firebase auth */}
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">Firebase Auth</span>
                  <Badge urgency="low">STANDBY</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Authentication schemas successfully configured inside client state hooks.
                </p>
              </div>

              {/* Firestore DB */}
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">Cloud Firestore</span>
                  <Badge urgency="low">STANDBY</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Database blueprint schema is successfully scaffolded inside workspace.
                </p>
              </div>

              {/* Gemini Flash */}
              <div className="p-4 bg-slate-50 rounded-xs border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">Gemini-3.5-Flash</span>
                  <Badge urgency="low">PROXY OK</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Secure proxy route active to prevent exposing developer API keys to browsers.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>SECURE SANDBOX ACTIVE</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

      </div>
    </div>
  );
}
export default ProfilePage;
