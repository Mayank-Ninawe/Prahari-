import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, HelpCircle, Lock, Mail } from "lucide-react";
import { useAuth } from "../../components/ui/ProtectedRoute";
import { LockedRoute } from "../../config/constants";
import { Button, Input, Badge } from "../../components/ui/BaseComponents";

export function AuthPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine redirection target (default to dashboard)
  const from = (location.state as any)?.from?.pathname || LockedRoute.DASHBOARD;

  // Immediately redirect if already logged in
  React.useEffect(() => {
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
    setError("");
    setIsLoading(true);

    try {
      await login(email);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Authentication simulation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-root" className="flex-1 grid md:grid-cols-12 min-h-[calc(100vh-4rem)] bg-slate-50 font-sans animate-fade-in text-left">
      
      {/* =========================================================================
          1. LEFT BRAND PANEL (SERIOUS SYSTEM CONTEXT)
          ========================================================================= */}
      <div id="auth-visual-panel" className="hidden md:flex md:col-span-5 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800 select-none">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
        {/* Ambient background glow */}
        <div className="absolute bottom-0 left-0 w-full h-80 bg-radial from-slate-800 to-transparent blur-3xl pointer-events-none"></div>

        {/* Top Branding Section */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white text-slate-900 rounded-xs flex items-center justify-center font-bold">
            <Shield className="w-4.5 h-4.5 text-slate-900" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-tight text-white leading-none">Prahari AI</span>
            <span className="text-[8px] text-slate-400 font-mono tracking-widest uppercase mt-1">Integrity Workspace</span>
          </div>
        </div>

        {/* Center Presentation Segment */}
        <div className="relative z-10 my-auto space-y-8 max-w-sm">
          <div className="space-y-3">
            <Badge urgency="medium">Secure Gateway</Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight font-sans">
              Actionable Milestone Protection
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Enter your workspace credentials to access dynamic diagnostics, compute project velocity, and deploy compressed rescue paths.
            </p>
          </div>
          
          {/* Key Guardrails List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-xs sm:text-sm">
              <div className="w-5 h-5 bg-slate-850 rounded-xs border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-slate-300 leading-relaxed">Early risk warnings driven by developer commit patterns.</p>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm">
              <div className="w-5 h-5 bg-slate-850 rounded-xs border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-slate-300 leading-relaxed">Gemini scope-compression isolating Minimum Viable Paths.</p>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm">
              <div className="w-5 h-5 bg-slate-850 rounded-xs border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-slate-300 leading-relaxed">Calm, non-intrusive focus boards to filter out scope creep.</p>
            </div>
          </div>
        </div>

        {/* Bottom system footer status */}
        <div className="relative z-10 flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>FIRESTORE BLUEPRINT STANDBY // PHASE 3</span>
        </div>
      </div>

      {/* =========================================================================
          2. RIGHT AUTH FORM PANEL (REFINED LIGHT THEME)
          ========================================================================= */}
      <div id="auth-form-panel" className="md:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header text */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
              {isLogin ? "Secure Entry Point" : "Workspace Onboarding"}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {isLogin ? "Sign in to Prahari Workspace" : "Register rescue profile"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isLogin 
                ? "Provide your details to synchronize your project state. If this is a simulation, click register below to initialize a stub account." 
                : "Enter details below to scaffold simulated credentials and configure your rescue parameters."}
            </p>
          </div>

          {/* Error Container */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              
              {/* Workspace Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
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
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 hover:bg-slate-50/50 border border-slate-250 focus:border-slate-900 focus:bg-white rounded-xs focus:ring-0 focus:outline-hidden transition-all"
                />
              </div>

              {/* Secure Password Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
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
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 hover:bg-slate-50/50 border border-slate-250 focus:border-slate-900 focus:bg-white rounded-xs focus:ring-0 focus:outline-hidden transition-all"
                />
              </div>

            </div>

            {/* Remember & Forgot controls */}
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2 select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded-xs focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-slate-500 cursor-pointer text-xs">Remember this device</label>
              </div>
              <a href="#forgot" className="text-slate-500 hover:text-slate-900 transition-colors text-xs">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <Button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              fullWidth
              icon={<ArrowRight className="w-4 h-4 text-white/90" />}
            >
              {isLoading ? "Synchronizing core parameters..." : (isLogin ? "Authenticate to Workspace" : "Register Simulated Credentials")}
            </Button>
          </form>

          {/* Calibration / Simulation Info block */}
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
            <HelpCircle className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <span>
              <strong>Note on simulation:</strong> Real Firebase backend storage will be initialized in later phases. Under current Phase 3 stubs, any password is valid, and the email provided registers as your local active user profile.
            </span>
          </div>

          {/* Switch Switcher link */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            {isLogin ? "Need a simulated account? " : "Already registered? "}
            <button
              id="auth-switch-mode-btn"
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-slate-950 underline hover:text-slate-700 focus:outline-hidden cursor-pointer"
              disabled={isLoading}
            >
              {isLogin ? "Register workspace credentials" : "Sign in here"}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
export default AuthPage;
