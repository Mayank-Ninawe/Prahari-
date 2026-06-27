import React, { useState, useEffect } from "react";
import { User, Bell, Calendar, ShieldCheck, ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/ui/ProtectedRoute";
import { FirebaseService } from "../../services/firebaseService";
import { NotificationService } from "../../services/notificationService";

export function ProfilePage() {
  const { firebaseUser, userDoc, refreshUserDoc, logout } = useAuth();
  
  // -- State: Profile Form --
  const [fullName, setFullName] = useState(userDoc?.fullName || "");
  const [workStyle, setWorkStyle] = useState(userDoc?.workStyle || "normal");
  const [pushEnabled, setPushEnabled] = useState(userDoc?.pushEnabled || false);
  const [calendarSync, setCalendarSync] = useState(userDoc?.calendarSync || false);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- State: Notifications --
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const notificationsSupported = "Notification" in window;

  useEffect(() => {
    if (notificationsSupported) {
      setPermissionState(Notification.permission);
    }
  }, [notificationsSupported]);

  // Sync state when userDoc loads
  useEffect(() => {
    if (userDoc) {
      setFullName(userDoc.fullName || "");
      setWorkStyle(userDoc.workStyle || "normal");
      setPushEnabled(userDoc.pushEnabled || false);
      setCalendarSync(userDoc.calendarSync || false);
    }
  }, [userDoc]);

  const handleRequestPermission = async () => {
    try {
      const permission = await NotificationService.requestPermission();
      setPermissionState(permission);
      if (permission === "granted") {
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
        setError("Browser notifications were denied.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to request notification permission.");
    }
  };

  const handleTestNotification = () => {
    NotificationService.sendLocalBrowserNotification(
      "Test Alert",
      "This is a test notification from Prahari AI."
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    
    setSavingSettings(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      await FirebaseService.updateUserDocument(firebaseUser.uid, {
        fullName,
        workStyle,
        pushEnabled,
        calendarSync
      });
      await refreshUserDoc();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-3xl mx-auto text-left animate-fade-in pb-12">
      
      {/* 1. HEADER HERO */}
      <div className="bg-[#faf9f6] border border-[#28251d]/8 p-6 md:p-8 rounded-sm shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#01696f]">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-[#f4f2ea] border border-[#28251d]/10 text-[#01696f] rounded-sm flex items-center justify-center text-xl font-serif font-bold shadow-xs shrink-0">
            {(fullName || firebaseUser?.email || "U")[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[#28251d] tracking-tight">
              {fullName || "Workspace User"}
            </h2>
            <p className="text-[9.5px] text-[#8a8880] font-mono font-semibold tracking-widest uppercase">
              {firebaseUser?.email || "demo@prahari.ai"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => logout()} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-[#28251d]/12 hover:border-[#01696f]/40 hover:bg-[#28251d]/4 text-[#28251d] hover:text-[#01696f] text-[9.5px] font-mono font-semibold uppercase tracking-wider rounded-sm transition-all duration-300 cursor-pointer w-full sm:w-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-sm rounded-sm flex items-center gap-3">
          <ShieldAlert className="w-4.5 h-4.5 text-[#be123c] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. SETTINGS FORM */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-[#28251d]/12 p-6 sm:p-8 rounded-sm shadow-sm space-y-10">
        
        {/* Section: Profile */}
        <div className="space-y-6">
          <div className="border-b border-[#28251d]/8 pb-4">
            <h3 className="text-lg font-serif font-bold text-[#28251d]">Account Settings</h3>
            <p className="text-sm text-[#7a7974] mt-1">Manage your identity and intervention preferences.</p>
          </div>

          <div className="space-y-1.5 max-w-md">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974] block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7974]" />
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm text-[#28251d] bg-[#f9f8f5] hover:bg-white border border-[#28251d]/15 focus:border-[#01696f] focus:bg-white rounded-sm focus:ring-1 focus:ring-[#01696f] focus:outline-none transition-all"
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="space-y-2 pb-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7a7974] block">
              Rescue Intervention Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
              {["relaxed", "normal", "aggressive"].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setWorkStyle(style)}
                  className={`px-4 py-3 text-sm font-medium border rounded-sm transition-all cursor-pointer flex flex-col gap-1 text-left ${
                    workStyle === style 
                      ? "bg-[#f9f8f5] text-[#28251d] border-[#01696f] shadow-sm ring-1 ring-[#01696f]/20" 
                      : "bg-transparent text-[#7a7974] hover:text-[#28251d] border-[#28251d]/15 hover:border-[#28251d]/30"
                  }`}
                >
                  <span className="capitalize font-serif font-bold">{style}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                    {style === "relaxed" && "Buffer-heavy"}
                    {style === "normal" && "Balanced approach"}
                    {style === "aggressive" && "Strict compression"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Integrations & Notifications */}
        <div className="space-y-6">
          <div className="border-b border-[#28251d]/8 pb-4">
            <h3 className="text-lg font-serif font-bold text-[#28251d]">Integrations & Alerts</h3>
            <p className="text-sm text-[#7a7974] mt-1">Connect your workspace tools and manage how you receive updates.</p>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 max-w-2xl">
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-serif font-bold text-[#28251d] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#7a7974]" />
                  <span>Urgent Web Alerts</span>
                </label>
                <p className="text-[13px] text-[#7a7974] leading-relaxed">
                  Receive browser notifications when a monitored task crosses high-risk thresholds and requires immediate attention.
                </p>
                
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  {!notificationsSupported ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-2 py-1 rounded-sm inline-block">Not Supported</span>
                  ) : permissionState === "granted" ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#01696f] bg-[#01696f]/10 border border-[#01696f]/20 px-2 py-1 rounded-sm inline-block">Authorized</span>
                  ) : permissionState === "denied" ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-2 py-1 rounded-sm inline-block">Blocked</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-4 py-2 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer inline-block"
                    >
                      Enable Alerts
                    </button>
                  )}
                  
                  {permissionState === "granted" && (
                     <button
                        type="button"
                        onClick={handleTestNotification}
                        className="px-4 py-2 border border-[#28251d]/15 hover:border-[#28251d]/40 bg-transparent text-[#28251d] rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer inline-block"
                      >
                        Test Alert
                      </button>
                  )}
                </div>
              </div>
              <div className="pt-1 sm:pt-0">
                <input 
                  type="checkbox" 
                  checked={pushEnabled}
                  disabled={permissionState !== "granted"}
                  onChange={(e) => {
                    if (permissionState === "granted") {
                      setPushEnabled(e.target.checked);
                    }
                  }}
                  className="w-5 h-5 text-[#01696f] border-[#28251d]/15 rounded-sm focus:ring-[#01696f] cursor-pointer disabled:opacity-50 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 max-w-2xl">
              <div className="space-y-1.5 flex-1">
                <label className="text-sm font-serif font-bold text-[#28251d] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#7a7974]" />
                  <span>Google Calendar Sync</span>
                </label>
                <p className="text-[13px] text-[#7a7974] leading-relaxed">
                  Automatically export critical task rescue plans to secure execution slots in your calendar.
                </p>
              </div>
              <div className="pt-1 sm:pt-0">
                <input
                  type="checkbox"
                  checked={calendarSync}
                  onChange={(e) => setCalendarSync(e.target.checked)}
                  className="w-5 h-5 text-[#01696f] border-[#28251d]/15 rounded-sm focus:ring-[#01696f] cursor-pointer bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t border-[#28251d]/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="h-6 flex items-center">
            {saveSuccess && (
              <span className="text-[10px] font-bold text-[#01696f] flex items-center gap-1.5 font-mono tracking-widest uppercase animate-fade-in">
                <ShieldCheck className="w-4 h-4" /> Preferences saved
              </span>
            )}
          </div>
          
          <button
            type="submit"
            disabled={savingSettings}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#01696f] hover:bg-[#005156] disabled:bg-[#7a7974] text-white px-6 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm hover:-translate-y-0.5 hover:shadow cursor-pointer border-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${savingSettings ? "animate-spin" : ""}`} />
            <span>{savingSettings ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>

    </div>
  );
}
