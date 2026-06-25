import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldAlert, 
  Zap, 
  Layers, 
  Bell, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Clock, 
  Check, 
  TrendingUp, 
  FileText, 
  Database,
  Calendar,
  Lock
} from "lucide-react";
import { LockedRoute } from "../../config/constants";
import { Button, Card, Badge } from "../../components/ui/BaseComponents";

export function LandingPage() {
  // Blocker simulator state for the hero interactive panel
  const [blockerTriggered, setBlockerTriggered] = useState(false);
  
  // Tab selector state for the product preview section
  const [activePreviewTab, setActivePreviewTab] = useState<"risk" | "compress" | "execute">("risk");

  return (
    <div id="landing-root" className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 animate-fade-in text-left">
      
      {/* =========================================================================
          1. HERO SECTION WITH HIGH-FIDELITY INTERACTIVE INTERVENTION ENGINE
          ========================================================================= */}
      <section id="hero-section" className="relative py-16 sm:py-24 bg-white border-b border-slate-200 overflow-hidden">
        {/* Subtle engineering-grid background backing */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        {/* Top visual radial gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-slate-100/50 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Core Column */}
            <div className="lg:col-span-5 space-y-6 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xs text-amber-800 text-[10px] font-mono uppercase tracking-wider">
                <Zap className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Active Protection Layer</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] font-sans">
                When reminders fail, <span className="text-amber-600 font-medium">Prahari AI</span> intervenes.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                We do not spam passive alerts or clutter your inbox. Prahari AI is a proactive deadline defense system. We trace execution velocity, predict milestone slippages early, and compress slipping backlogs into a guaranteed **Minimum Viable Path** to secure critical release windows.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full pt-2">
                <Link to={LockedRoute.AUTH} className="w-full sm:w-auto">
                  <Button 
                    id="hero-primary-cta"
                    variant="primary" 
                    fullWidth 
                    icon={<ArrowRight className="w-4 h-4 text-white/90" />}
                  >
                    Enter Workspace Shell
                  </Button>
                </Link>
                <a href="#how-it-works-section" className="w-full sm:w-auto">
                  <Button 
                    id="hero-secondary-cta"
                    variant="outline" 
                    fullWidth
                  >
                    Explore Methodology
                  </Button>
                </a>
              </div>

              {/* Engineering Standard Indicators */}
              <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 items-center text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  VELOCITY SCANNING ACTIVE
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  FIRESTORE COMPLIANT STATE
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  GEMINI INTERACTION READY
                </span>
              </div>
            </div>

            {/* Right Interactive Simulator Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="bg-slate-900 rounded-md shadow-lg border border-slate-800 overflow-hidden max-w-2xl w-full mx-auto">
                
                {/* Simulated Window Control Bar */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-sm text-[10px] text-slate-400 font-mono w-64 text-center truncate select-none">
                    prahari.ai/workspace/gateway-rearchitecture
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest hidden sm:inline">LIVE INTERVENTION</span>
                </div>

                {/* Simulated App Container */}
                <div className="p-6 bg-slate-900 text-left space-y-6">
                  
                  {/* Top: Current Goal details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Goal Telemetry</span>
                      <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider mt-0.5">Q3 Analytics Engine Sync</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        In 6 Days
                      </span>
                      <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                      <span>8 Core Tasks</span>
                    </div>
                  </div>

                  {/* Simulator Control Box */}
                  <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-sm space-y-3">
                    <div className="flex items-start gap-3">
                      <Sliders className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">Interactive Deadline Simulator</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          By default, execution metrics indicate normal progress. Click the trigger button below to simulate an active milestone slippage.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        id="hero-simulator-trigger"
                        onClick={() => setBlockerTriggered(!blockerTriggered)}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all ${
                          blockerTriggered 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs" 
                            : "bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                        }`}
                      >
                        {blockerTriggered ? "Reset Metrics" : "Trigger Blocker (30h Delay)"}
                      </button>
                    </div>
                  </div>

                  {/* Calculations Block */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3.5 rounded-sm border border-slate-850">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Calculated Risk Index</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-bold font-mono tracking-tight transition-colors duration-300 ${
                          blockerTriggered ? "text-rose-500" : "text-emerald-500"
                        }`}>
                          {blockerTriggered ? "87%" : "34%"}
                        </span>
                        <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${
                          blockerTriggered ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {blockerTriggered ? "CRITICAL" : "NORMAL"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-sm border border-slate-850">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Prahari Backlog Compression</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-bold font-mono tracking-tight transition-colors duration-300 ${
                          blockerTriggered ? "text-amber-500 font-bold" : "text-slate-500"
                        }`}>
                          {blockerTriggered ? "-35%" : "0%"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Scope hours reduced</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Intervention Rescue Output Pane */}
                  <div className={`transition-all duration-300 overflow-hidden ${
                    blockerTriggered ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
                  }`}>
                    <div className="bg-slate-950 border border-amber-500/20 p-4 rounded-sm space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 font-mono">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>INTERVENTION SCHEME COMPILED</span>
                        </span>
                        <Badge urgency="medium">COMPRESSION STAGE 1</Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">1</span>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200">De-prioritize Historical Analytics Charts</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              Postpone complex high-overhead rendering engines. Serve raw JSON export telemetry first. Saves 16 engineering hours.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">2</span>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200">Bypass OAuth client integrations</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              Leverage simulated JWT workspace stubs temporarily. Restrict live connections to database credentials only. Saves 14 engineering hours.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Static Normal Progress Indicator */}
                  <div className={`transition-all duration-300 overflow-hidden ${
                    !blockerTriggered ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
                  }`}>
                    <div className="p-4 border border-slate-800 bg-slate-950/20 rounded-sm text-center">
                      <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Telemetry indicators healthy. Ready to simulate slippages.</span>
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. PROBLEM SECTION (CONCISE & VISUALLY SHARP)
          ========================================================================= */}
      <section id="problem-section" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Why Projects Fail</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5 leading-tight">
              Reminders tell you what is late. Prahari resolves why it's late.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            <Card className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 bg-rose-50 rounded-xs border border-rose-100 flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5 text-rose-600" />
                </div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-950">Passive Alarm Fatigue</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Traditional task managers rely on push notifications and alerts. When a project slips, they create noise instead of capacity—bombarding you with alarm indicators without presenting viable options.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-6 text-[10px] font-mono font-bold text-rose-600 uppercase">
                Reminders fail passively
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xs border border-amber-100 flex items-center justify-center">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-950">Ambiguity Under Pressure</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Under strict deadlines, teams lose precious velocity trying to decide which features are critical and which can be deferred. Priority ambiguity and scope creep are the true killers of Q4 delivery goals.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-6 text-[10px] font-mono font-bold text-amber-600 uppercase">
                Ambiguity halts execution
              </div>
            </Card>

            <Card className="bg-slate-900 text-white border border-slate-800 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 bg-slate-850 rounded-xs border border-slate-800 flex items-center justify-center">
                  <CheckCircle2 className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white">Continuous AI Intervention</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Prahari AI acts as a quiet, protective layer. When risk indices rise, it uses Gemini-driven scope models to compress deliverables. We isolate a tight, clear Minimum Viable Path so you only execute what's essential.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 mt-6 text-[10px] font-mono font-bold text-amber-500 uppercase">
                Prahari active intervention
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. HOW PRAHARI AI WORKS SECTION (3-STEP GRAPHIC ARCHITECTURE)
          ========================================================================= */}
      <section id="how-it-works-section" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">The Core Engine</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Three Steps to Secure Delivery
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              How the Prahari core protocol analyzes, simplifies, and preserves target milestones.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 relative">
            
            {/* Step 1 */}
            <div className="space-y-4 text-left relative z-10">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-slate-200 tracking-tight">01</span>
                <span className="h-[1px] flex-1 bg-slate-100 hidden lg:block mr-4 mt-2"></span>
              </div>
              <div className="space-y-2">
                <Badge urgency="low">Diagnostic Stage</Badge>
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Detect Execution Risk</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  By tracking commit activity rates and blockers, our algorithm measures historical velocity. It evaluates your milestone margin of safety daily, computing risk scores before slippages occurs.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-left relative z-10">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-slate-200 tracking-tight">02</span>
                <span className="h-[1px] flex-1 bg-slate-100 hidden lg:block mr-4 mt-2"></span>
              </div>
              <div className="space-y-2">
                <Badge urgency="medium">Gemini Compression</Badge>
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Build Rescue Playbook</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When risk thresholds cross 75%, Prahari automatically initiates the Gemini engine. It strips high-overhead scope items (such as secondary visualizations, complex reporting integrations, or extensive logs), producing a lightweight Minimum Viable Task blueprint.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-left relative z-10">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-slate-200 tracking-tight">03</span>
              </div>
              <div className="space-y-2">
                <Badge urgency="high">Execution Lock-In</Badge>
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Guide Focus Path</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our system keeps your attention locked strictly onto the compressed path. Using actionable task lists, local storage persistence, and subtle non-fatiguing web push alerts, we shield developers from focus noise.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PRODUCT PREVIEW & FUTURE SCREENSHOTS SECTION (INTERACTIVE PREVIEWS)
          ========================================================================= */}
      <section id="screenshots-section" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Workspace Previews</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Designed for Calm Engineering Focus
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prahari's layout was designed to eliminate noise. Explore the core interface shells prepared for final database and telemetry integrations.
              </p>

              {/* Tab Toggles */}
              <div className="space-y-3 pt-2">
                <button
                  id="tab-btn-risk"
                  onClick={() => setActivePreviewTab("risk")}
                  className={`w-full text-left p-4 rounded-xs border transition-all cursor-pointer ${
                    activePreviewTab === "risk"
                      ? "bg-white border-slate-300 shadow-xs"
                      : "bg-transparent border-transparent hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wider">01. Risk Diagnostics Board</p>
                  <p className="text-[11px] text-slate-500 mt-1">Monitor real-time team commits, backlog velocity, and calculated milestone risk indices.</p>
                </button>

                <button
                  id="tab-btn-compress"
                  onClick={() => setActivePreviewTab("compress")}
                  className={`w-full text-left p-4 rounded-xs border transition-all cursor-pointer ${
                    activePreviewTab === "compress"
                      ? "bg-white border-slate-300 shadow-xs"
                      : "bg-transparent border-transparent hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wider">02. Backlog Scope Compressor</p>
                  <p className="text-[11px] text-slate-500 mt-1">Review original task loads side-by-side with Gemini-isolated Minimum Viable Paths.</p>
                </button>

                <button
                  id="tab-btn-execute"
                  onClick={() => setActivePreviewTab("execute")}
                  className={`w-full text-left p-4 rounded-xs border transition-all cursor-pointer ${
                    activePreviewTab === "execute"
                      ? "bg-white border-slate-300 shadow-xs"
                      : "bg-transparent border-transparent hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wider">03. High-Integrity Focus Sheet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Quiet checklists and custom notification controls that shield delivery execution.</p>
                </button>
              </div>
            </div>

            {/* Right Visual Display Column (Fidelity CSS/SVG Mockups) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-md border border-slate-200 shadow-md overflow-hidden p-6 min-h-[460px] flex flex-col justify-between">
                
                {/* Header panel */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                      Prahari Interface Shell // Preview
                    </span>
                  </div>
                  <Badge urgency={activePreviewTab === "risk" ? "medium" : activePreviewTab === "compress" ? "high" : "low"}>
                    {activePreviewTab === "risk" ? "DIAGNOSTIC MODE" : activePreviewTab === "compress" ? "AI ENGINE ONLINE" : "EXECUTION STANDBY"}
                  </Badge>
                </div>

                {/* Sub-panels representing Tab Views */}
                <div className="flex-1 flex flex-col justify-center">
                  
                  {/* TAB 1: RISK DIAGNOSTICS */}
                  {activePreviewTab === "risk" && (
                    <div id="preview-tab-risk-content" className="space-y-6 text-left animate-fade-in">
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-950 font-mono">CRITICAL INCIDENT ACTIVE</p>
                          <p className="text-[11px] text-rose-800 leading-relaxed mt-1">
                            Q3 compliance deadline breaching safety threshold. Core SQL driver migration delayed by team member absence. Actionable intervention recommended.
                          </p>
                        </div>
                      </div>

                      {/* Velocity metrics list */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-medium text-slate-700">Team Target Capacity Score</span>
                          <span className="font-bold font-mono text-slate-900">42 hrs / week</span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-medium text-slate-700">Calculated Cumulative Slippage Lags</span>
                          <span className="font-bold font-mono text-rose-600">+3.4 days</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pb-2">
                          <span className="font-medium text-slate-700">Project Slippage Warning Level</span>
                          <span className="font-bold font-mono text-amber-600">82% RISK SCORE</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: COMPRESSOR */}
                  {activePreviewTab === "compress" && (
                    <div id="preview-tab-compress-content" className="space-y-6 text-left animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                          <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Standard Scope</span>
                          <p className="text-xs font-bold text-slate-900 font-mono">98 Estimate Hours</p>
                          <ul className="text-[10px] text-slate-500 space-y-1 mt-2.5 list-disc pl-3">
                            <li>Re-index client tables</li>
                            <li>Write deep query metrics</li>
                            <li>Configure SVG dashboard</li>
                            <li>Build multi-tenant roles</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-sm">
                          <span className="text-[9px] font-mono font-bold text-amber-600 block uppercase mb-1">Minimum Viable Path</span>
                          <p className="text-xs font-bold text-slate-900 font-mono">62 Compress Hours</p>
                          <ul className="text-[10px] text-slate-600 space-y-1 mt-2.5 font-bold list-disc pl-3">
                            <li>Re-index client tables</li>
                            <li className="line-through text-slate-400 font-normal">Write deep query metrics</li>
                            <li>Configure SVG dashboard</li>
                            <li className="line-through text-slate-400 font-normal">Build multi-tenant roles</li>
                          </ul>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-sm text-[10px] font-mono text-slate-500">
                        <strong>Gemini Directive:</strong> Deferred 36 engineering hours of non-essential visual tracking logs and tenant controls to secure core delivery dates on schedule.
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FOCUS SHEET */}
                  {activePreviewTab === "execute" && (
                    <div id="preview-tab-execute-content" className="space-y-4 text-left animate-fade-in">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        The Active Focus checklist filters out the noise, providing developers with quiet, actionable targets.
                      </p>

                      <div className="space-y-2">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4.5 h-4.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                              <Check className="w-3 h-3 text-emerald-700" />
                            </span>
                            <span className="font-medium text-slate-900">Configure core indexing structures</span>
                          </div>
                          <Badge>COMPLETED</Badge>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4.5 h-4.5 border border-slate-300 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-slate-400 shrink-0">
                              2
                            </span>
                            <span className="font-medium text-slate-900">Map static data feeds to secondary routes</span>
                          </div>
                          <Badge urgency="medium">ACTIVE PATH</Badge>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4.5 h-4.5 border border-slate-300 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-slate-400 shrink-0">
                              3
                            </span>
                            <span className="font-medium text-slate-500 line-through">Establish multi-tenant login profiles</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">DEFERRED</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer details */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 mt-6">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-350" />
                    FIRESTORE STANDBY REGISTERED
                  </span>
                  <span>VERSION 2.0_SHELL</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          5. REAL-WORLD SCENARIO SECTION (CONCRETE RELATABLE CASE)
          ========================================================================= */}
      <section id="scenario-section" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Visual case study container */}
            <div className="order-2 lg:order-1">
              <div className="bg-slate-50 rounded-sm border border-slate-200 p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Prahari Incident Ledger</span>
                  <Badge urgency="high">CASE DEPLOYED</Badge>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-600 block uppercase">Project Segment</span>
                    <p className="text-xs font-bold text-slate-900 font-mono uppercase">User Database GDPR Upgrade</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-600 block uppercase">Critical Blocker</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lead database engineer falls ill 48 hours before compliance audit. Backlog task load stands at 72 hours of developer bandwidth.
                    </p>
                  </div>

                  {/* Compression comparison metrics */}
                  <div className="p-4 bg-slate-900 text-white rounded-xs space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Standard task list load:</span>
                      <span>72 hours</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Prahari Minimum Viable Path:</span>
                      <span>44 hours (-38%)</span>
                    </div>
                    <div className="h-[1px] bg-slate-800 my-2"></div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      <strong>Resolution Outcome:</strong> Excluded visual GDPR analytical exports and localized telemetry reporting logs. Preserved core datastore user hashing, secure audits, and database indexes. Audit completed successfully on schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative */}
            <div className="space-y-6 text-left order-1 lg:order-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">A Concrete Scenario</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5 leading-tight">
                The Compliance Deadline Gate
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Imagine a critical GDPR data upgrade scheduled for a mandatory compliance audit. With 48 hours left, the lead database engineer falls ill. Traditional task managers will continue to sound alarms, raising team anxiety levels while milestones slip.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prahari AI intercepts this delay dynamically. By scanning execution metrics, it isolated the core compliance goals—the secure database hashing and logs—and deferred the high-overhead dashboard exporters. The audit succeeded on time, without team burnout.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Preserves Quality</strong>: Focuses developer focus purely on stable, secure code paths.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Maintains Velocity</strong>: Isolates what can be deferred so work is never blocked by bottlenecks.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FINAL CALL TO ACTION SECTION (CLEAN & HIGH CONTRAST)
          ========================================================================= */}
      <section id="final-cta-section" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-radial from-slate-800/80 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-white/10 rounded-xs border border-white/20 flex items-center justify-center shadow-md">
            <Lock className="w-5.5 h-5.5 text-amber-500" />
          </div>

          <div className="space-y-3.5 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Protect your next critical milestone.
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Gain access to the Prahari AI workspace shell. Log in to explore mock projects, run active compression paths, and manage alert variables securely.
            </p>
          </div>

          <div>
            <Link id="final-cta-btn" to={LockedRoute.AUTH}>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono rounded-xs transition-all shadow-md cursor-pointer">
                Initialize Workspace Shell <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
export default LandingPage;
