import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Shield, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Sliders, 
  Key, 
  RefreshCw, 
  Database,
  Lock,
  Mail,
  User,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "../../components/ui/ProtectedRoute";
import { LockedRoute } from "../../config/constants";

export function AuthPage() {
  const { login, signup, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Developer custom API credentials states (tucked under hidden gear / toggle at footer)
  const [showConfigBox, setShowConfigBox] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [firebaseApiKey, setFirebaseApiKey] = useState("");
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState("");
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState("");
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState("");
  const [firebaseAppId, setFirebaseAppId] = useState("");
  const [firebaseFirestoreDatabaseId, setFirebaseFirestoreDatabaseId] = useState("");
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSaveSuccess, setKeysSaveSuccess] = useState(false);

  // Load keys on component mount
  useEffect(() => {
    setGeminiApiKey(localStorage.getItem("prahari_gemini_api_key") || "");
    setFirebaseApiKey(localStorage.getItem("prahari_firebase_api_key") || "");
    setFirebaseAuthDomain(localStorage.getItem("prahari_firebase_auth_domain") || "");
    setFirebaseProjectId(localStorage.getItem("prahari_firebase_project_id") || "");
    setFirebaseStorageBucket(localStorage.getItem("prahari_firebase_storage_bucket") || "");
    setFirebaseMessagingSenderId(localStorage.getItem("prahari_firebase_messaging_sender_id") || "");
    setFirebaseAppId(localStorage.getItem("prahari_firebase_app_id") || "");
    setFirebaseFirestoreDatabaseId(localStorage.getItem("prahari_firebase_firestore_database_id") || "");
  }, []);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    setKeysSaveSuccess(false);

    try {
      const setOrClear = (storageKey: string, val: string) => {
        if (val.trim()) {
          localStorage.setItem(storageKey, val.trim());
        } else {
          localStorage.removeItem(storageKey);
        }
      };

      setOrClear("prahari_gemini_api_key", geminiApiKey);
      setOrClear("prahari_firebase_api_key", firebaseApiKey);
      setOrClear("prahari_firebase_auth_domain", firebaseAuthDomain);
      setOrClear("prahari_firebase_project_id", firebaseProjectId);
      setOrClear("prahari_firebase_storage_bucket", firebaseStorageBucket);
      setOrClear("prahari_firebase_messaging_sender_id", firebaseMessagingSenderId);
      setOrClear("prahari_firebase_app_id", firebaseAppId);
      setOrClear("prahari_firebase_firestore_database_id", firebaseFirestoreDatabaseId);

      setKeysSaveSuccess(true);
      setTimeout(() => {
        setKeysSaveSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error saving keys locally:", err);
      setError("Failed to persist secure credentials in sandbox.");
    } finally {
      setSavingKeys(false);
    }
  };

  // Determine redirection target (default to dashboard)
  const from = (location.state as any)?.from?.pathname || LockedRoute.DASHBOARD;

  // Immediately redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide a valid workspace email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Google authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // State for subtle hover rotation effect on the left-side decorative element
  const [isVisualHovered, setIsVisualHovered] = useState(false);
  const [visualMouse, setVisualMouse] = useState({ x: 0, y: 0 });

  const handleVisualMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setVisualMouse({ x, y });
  };

  return (
    <div id="auth-root" className="min-h-screen bg-[#f9f8f5] text-[#28251d] font-sans antialiased selection:bg-[#01696f]/10 selection:text-[#01696f] flex flex-col">
      
      {/* =========================================================================
          1. MINIMAL TOP NAVIGATION
          ========================================================================= */}
      <header className="border-b border-[#28251d]/12 h-18 shrink-0 bg-[#f9f8f5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-full flex items-center justify-between">
          <Link to={LockedRoute.LANDING} className="flex items-center gap-3 group focus:outline-none">
            <div className="w-8 h-8 bg-[#01696f] flex items-center justify-center rounded-sm transition-transform duration-300 group-hover:scale-105">
              <Shield className="w-4.5 h-4.5 text-[#f9f8f5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-lg tracking-tight leading-none text-[#28251d]">Prahari AI</span>
              <span className="text-[9px] font-mono tracking-widest text-[#7a7974] uppercase mt-1">Active Milestone Shield</span>
            </div>
          </Link>

          <Link 
            to={LockedRoute.LANDING} 
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#7a7974] hover:text-[#28251d] transition-colors focus:outline-none group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* =========================================================================
          2. TWO-COLUMN RESPONSIVE LAYOUT
          ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 py-10 sm:py-16 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        
        {/* LEFT COLUMN: TRUST / BRAND STATEMENT WITH PREMIUM ABSTRACT VISUAL */}
        <div className="lg:col-span-5 space-y-8 text-left h-full flex flex-col justify-center">
          
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-[#01696f] bg-[#01696f]/5 border border-[#01696f]/15 px-2.5 py-1 rounded-sm inline-block">
              Secure Entry Protocol
            </span>
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#28251d] tracking-tight leading-tight">
              Enter the Prahari workspace.
            </h1>
            <p className="text-base text-[#7a7974] font-medium leading-relaxed max-w-md">
              Access your active rescue campaigns, compute sprint risk diagnostics, and review Gemini’s automated backlog scope compression algorithms.
            </p>
          </div>

          {/* HUMAN-FRIENDLY LAYERED TASK PANEL DECORATIVE ELEMENT */}
          <div 
            onMouseMove={handleVisualMouseMove}
            onMouseEnter={() => setIsVisualHovered(true)}
            onMouseLeave={() => {
              setIsVisualHovered(false);
              setVisualMouse({ x: 0, y: 0 });
            }}
            className="bg-[#f3f0ec] border border-[#28251d]/12 p-6 rounded-sm shadow-sm relative transition-all duration-300 hidden md:block w-full max-w-md"
            style={{
              transform: isVisualHovered 
                ? `perspective(1000px) rotateY(${visualMouse.x * 10}deg) rotateX(${visualMouse.y * -10}deg) scale(1.01)`
                : `perspective(1000px) rotateY(4deg) rotateX(2deg) scale(1)`,
              transition: isVisualHovered ? "none" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), shadow 0.4s ease"
            }}
          >
            {/* Window Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-[#28251d]/10 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#01696f]/30"></span>
                <span className="w-2 h-2 rounded-full bg-[#01696f]/30"></span>
                <span className="w-2 h-2 rounded-full bg-[#01696f]/30"></span>
              </div>
              <span className="text-[9px] font-mono text-[#7a7974] font-bold tracking-widest uppercase">
                WORKSPACE SHIELD ACTIVE
              </span>
            </div>

            {/* Checklist elements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base text-[#28251d]">GDPR Security Hardening</h4>
                <span className="px-2 py-0.5 text-[8px] font-mono font-bold bg-[#01696f]/10 text-[#01696f] border border-[#01696f]/20 rounded-sm uppercase">
                  Back on Track
                </span>
              </div>

              <div className="space-y-2.5 font-sans text-xs text-[#7a7974]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#01696f]/10 text-[#01696f] border border-[#01696f]/20 rounded-xs flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="line-through">Isolate primary database hashing functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#01696f]/10 text-[#01696f] border border-[#01696f]/20 rounded-xs flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="line-through">De-scope optional analytics dashboards</span>
                </div>
                <div className="flex items-center gap-2 text-[#28251d] font-bold">
                  <div className="w-4 h-4 rounded-xs border border-[#01696f] flex items-center justify-center relative shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#01696f] animate-ping absolute"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#01696f]"></span>
                  </div>
                  <span className="flex items-center gap-1.5">
                    Active workspace lock-in active
                    <Sparkles className="w-3 h-3 text-[#01696f]" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-mono text-[#7a7974] tracking-wider uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#437a22] animate-pulse"></span>
            DURABLE CLOUD SYNC STANDBY // FIRESTORE SECURE
          </p>

        </div>

        {/* RIGHT COLUMN: REFINED AUTH FORM CARD */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-[#f3f0ec] border border-[#28251d]/12 rounded-sm p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Form Title & Contextual description */}
            <div className="space-y-1.5 text-left">
              <h2 className="font-serif font-bold text-2xl text-[#28251d]">
                {isLogin ? "Sign in" : "Create account"}
              </h2>
              <p className="text-xs text-[#7a7974] leading-relaxed">
                {isLogin 
                  ? "Enter your workspace email and password to sync your session state."
                  : "Initialize safe credentials to register parameters and mock your sandbox environment."}
              </p>
            </div>

            {/* Error alerts if any */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm text-xs text-left animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Input fields form */}
            <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name field (Register only) */}
              {!isLogin && (
                <div className="space-y-1 text-left animate-fade-in">
                  <label htmlFor="fullName" className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7a7974] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#7a7974]" />
                    <span>Workspace Full Name</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Sarah Jenkins"
                    disabled={isLoading}
                    className="w-full px-3.5 py-3 text-xs text-[#28251d] placeholder:text-[#7a7974]/50 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/25 focus:border-[#01696f] rounded-xs focus:ring-0 focus:outline-none transition-all"
                  />
                </div>
              )}

              {/* Email address field */}
              <div className="space-y-1 text-left">
                <label htmlFor="email" className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7a7974] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#7a7974]" />
                  <span>Workspace Email Address</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., lead-engineer@prahari.ai"
                  disabled={isLoading}
                  className="w-full px-3.5 py-3 text-xs text-[#28251d] placeholder:text-[#7a7974]/50 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/25 focus:border-[#01696f] rounded-xs focus:ring-0 focus:outline-none transition-all"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1 text-left">
                <label htmlFor="password" className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7a7974] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#7a7974]" />
                  <span>Secure Password</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full px-3.5 py-3 text-xs text-[#28251d] placeholder:text-[#7a7974]/50 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/25 focus:border-[#01696f] rounded-xs focus:ring-0 focus:outline-none transition-all"
                />
              </div>

              {/* Submit CTA */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#01696f] hover:bg-[#005156] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <span>
                  {isLoading ? "Synchronizing credentials..." : (isLogin ? "Authenticate Session" : "Create Safe Account")}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Divider for single sign-on */}
              <div className="relative py-2 flex items-center">
                <div className="flex-grow border-t border-[#28251d]/10"></div>
                <span className="flex-shrink mx-3 text-[8px] font-mono font-bold uppercase tracking-widest text-[#7a7974]">
                  OR GOOGLE SINGLE SIGN-ON
                </span>
                <div className="flex-grow border-t border-[#28251d]/10"></div>
              </div>

              {/* Google Sign-In */}
              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 text-xs font-semibold text-[#28251d] bg-[#f9f8f5] hover:bg-[#f3f0ec] border border-[#28251d]/12 hover:border-[#28251d]/30 rounded-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google Account</span>
              </button>

            </form>

            {/* Mode Switching link */}
            <div className="pt-4 border-t border-[#28251d]/10 text-center text-xs text-[#7a7974]">
              <span>
                {isLogin ? "New here? " : "Already registered? "}
              </span>
              <button
                id="auth-switch-mode-btn"
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-[#01696f] underline hover:text-[#005156] focus:outline-none cursor-pointer border-none bg-transparent"
                disabled={isLoading}
              >
                {isLogin ? "Create workspace credentials" : "Sign in here"}
              </button>
            </div>

            {/* Low-priority Security reassurance line */}
            <p className="text-[10px] text-[#7a7974] leading-normal font-mono text-center">
              🔒 Standard SSL Encryption / Secure Cookie Tokens
            </p>

            {/* Collapsible Sandbox API keys panel (Discreetly positioned footnote toggle for judges) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowConfigBox(!showConfigBox)}
                className="text-[10px] font-mono text-[#7a7974]/65 hover:text-[#28251d] transition-colors focus:outline-none cursor-pointer border-none bg-transparent mx-auto block"
              >
                {showConfigBox ? "▲ Hide Sandbox Overrides" : "▼ Configure Sandbox Overrides"}
              </button>

              {showConfigBox && (
                <div className="mt-4 p-4 bg-[#f9f8f5] border border-[#28251d]/12 rounded-sm text-left animate-fade-in space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#7a7974] flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gemini API Key</span>
                    </span>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy... (leave blank to fallback to server-side)"
                      className="w-full px-3 py-1.5 text-xs font-mono text-[#28251d] bg-[#f3f0ec] border border-[#28251d]/12 rounded-xs focus:outline-none focus:border-[#01696f] transition-all"
                    />
                  </div>

                  <div className="border-t border-[#28251d]/10 pt-3.5 space-y-3">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#7a7974] flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-[#7a7974]" />
                      <span>Firebase Direct Overrides</span>
                    </span>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-mono font-bold text-[#7a7974]">API Key</label>
                        <input
                          type="password"
                          value={firebaseApiKey}
                          onChange={(e) => setFirebaseApiKey(e.target.value)}
                          placeholder="Firebase Web API Key"
                          className="w-full px-2.5 py-1.5 text-[10px] font-mono text-[#28251d] bg-[#f3f0ec] border border-[#28251d]/12 rounded-xs focus:outline-none focus:border-[#01696f]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-mono font-bold text-[#7a7974]">Project ID</label>
                        <input
                          type="text"
                          value={firebaseProjectId}
                          onChange={(e) => setFirebaseProjectId(e.target.value)}
                          placeholder="project-id-123"
                          className="w-full px-2.5 py-1.5 text-[10px] font-mono text-[#28251d] bg-[#f3f0ec] border border-[#28251d]/12 rounded-xs focus:outline-none focus:border-[#01696f]"
                        />
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveKeys} className="pt-3 border-t border-[#28251d]/10 flex items-center justify-between">
                    {keysSaveSuccess ? (
                      <span className="text-[9px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                        Saved! Reloading...
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#7a7974] font-mono">Stores locally.</span>
                    )}
                    <button
                      type="submit"
                      disabled={savingKeys}
                      className="px-3 py-1.5 bg-[#28251d] text-[#f9f8f5] hover:bg-[#01696f] rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border-none shadow-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${savingKeys ? "animate-spin" : ""}`} />
                      <span>Save Config</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* Minimal Footer */}
      <footer className="h-14 border-t border-[#28251d]/12 flex items-center justify-center shrink-0 bg-[#f3f0ec]">
        <p className="text-[10px] font-mono text-[#7a7974] uppercase tracking-widest">
          © 2026 Prahari AI // Safe Workspace Environment
        </p>
      </footer>

    </div>
  );
}

export default AuthPage;
