import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
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
  Lock,
  ChevronRight,
  MousePointerClick,
  Maximize2
} from "lucide-react";
import { LockedRoute } from "../../config/constants";
import { Button, Card, Badge } from "../../components/ui/BaseComponents";

export function LandingPage() {
  // Blocker simulator state for the hero interactive panel
  const [blockerTriggered, setBlockerTriggered] = useState(false);
  
  // Tab selector state for the product preview section
  const [activePreviewTab, setActivePreviewTab] = useState<"risk" | "compress" | "execute">("risk");

  // Parallax Scroll State
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3D Hover Tilt state for Hero Simulator Console
  const [isSimHovered, setIsSimHovered] = useState(false);
  const [simMouse, setSimMouse] = useState({ x: 0, y: 0 });

  const handleSimMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setSimMouse({ x, y });
  };

  // 3D Hover Tilt state for Case Study Card
  const [isCaseHovered, setIsCaseHovered] = useState(false);
  const [caseMouse, setCaseMouse] = useState({ x: 0, y: 0 });

  const handleCaseMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCaseMouse({ x, y });
  };

  // Parallax multipliers
  const backgroundY = scrollY * 0.15;
  const cardFloatY = Math.sin(Date.now() / 1500) * 8; // subtle ambient floating logic for aesthetic satisfaction

  return (
    <div id="landing-root" className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 animate-fade-in text-left overflow-x-hidden">
      
      {/* =========================================================================
          1. HERO SECTION WITH 3D LAYERED PARALLAX DEPTH & INTERACTIVE SIMULATOR
          ========================================================================= */}
      <section id="hero-section" className="relative py-20 sm:py-28 bg-white border-b border-slate-200 overflow-hidden min-h-[90vh] flex items-center">
        {/* Subtle engineering-grid background backing */}
        <div 
          className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"
          style={{ transform: `translateY(${backgroundY * 0.4}px)` }}
        ></div>
        
        {/* Top radial light accent to frame typography */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-slate-100/60 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Core Column: Headline and Positioning */}
            <div className="lg:col-span-5 space-y-7 flex flex-col items-start relative">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-sm text-amber-800 text-[10px] font-mono uppercase tracking-wider font-bold shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Prahari Active Sentinel Layer Active</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-slate-900 leading-[1.08] font-sans"
              >
                When alerts fail, <span className="text-amber-500 font-medium relative">Prahari AI<span className="absolute left-0 bottom-0.5 w-full h-1 bg-amber-200 -z-10"></span></span> intervenes.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl"
              >
                We do not spam passive email alerts or crowd your notification feeds. Prahari AI acts as an emergency response system. We monitor execution velocity, predict milestone slippages, and dynamically compress slip backlogs into a crisp, actionable **Minimum Viable Path** to secure critical deliverables.
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full pt-1"
              >
                <Link to={LockedRoute.AUTH} className="w-full sm:w-auto">
                  <Button 
                    id="hero-primary-cta"
                    variant="primary" 
                    fullWidth 
                    className="group hover:-translate-y-0.5 active:translate-y-0 transition-transform font-mono text-xs uppercase tracking-wider font-bold py-3 px-6"
                    icon={<ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />}
                  >
                    Enter Workspace Shell
                  </Button>
                </Link>
                <a href="#how-it-works-section" className="w-full sm:w-auto">
                  <Button 
                    id="hero-secondary-cta"
                    variant="outline" 
                    fullWidth
                    className="hover:bg-slate-50 hover:border-slate-400 font-mono text-xs uppercase tracking-wider font-bold py-3 px-6"
                  >
                    Explore Methodology
                  </Button>
                </a>
              </motion.div>

              {/* Engineering Standard Indicators */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="pt-4 flex flex-wrap gap-x-6 gap-y-2.5 items-center text-[10px] text-slate-500 font-mono"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  VELOCITY MONITORING ACTIVE
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  FIRESTORE PERSISTENT STATE
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  GEMINI 2.5 INTEGRATION
                </span>
              </motion.div>
            </div>

            {/* Right Interactive Simulator Column: 3D perspective floating panels */}
            <div className="lg:col-span-7 flex flex-col justify-center relative select-none">
              
              {/* Backing decorative schematic grid (Parallax offset) */}
              <div 
                className="absolute -top-10 -left-10 w-48 h-48 border-l border-t border-slate-200 pointer-events-none rounded-tl-lg hidden sm:block opacity-60"
                style={{ transform: `translateY(${scrollY * -0.06}px)` }}
              >
                <div className="w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:12px_12px] opacity-40"></div>
              </div>

              {/* Backing structural wireframe representation for 3D depth */}
              <div 
                className="absolute -bottom-6 -right-6 w-full h-full bg-slate-100 rounded-lg border border-slate-200 pointer-events-none -z-10"
                style={{ 
                  transform: `translate3d(${scrollY * 0.04}px, ${scrollY * 0.08}px, 0px) rotate(-1.5deg)`,
                  transition: "transform 0.1s ease-out"
                }}
              ></div>

              {/* Main Interactive Terminal Card (With 3D Mouse Tilt and dynamic content) */}
              <div
                onMouseMove={handleSimMouseMove}
                onMouseEnter={() => setIsSimHovered(true)}
                onMouseLeave={() => {
                  setIsSimHovered(false);
                  setSimMouse({ x: 0, y: 0 });
                }}
                className="bg-slate-900 rounded-md shadow-2xl border-2 border-slate-950 overflow-hidden w-full mx-auto relative transition-transform duration-300"
                style={{
                  transform: isSimHovered 
                    ? `perspective(1000px) rotateX(${simMouse.y * -12}deg) rotateY(${simMouse.x * 12}deg) translateZ(10px)`
                    : `perspective(1000px) rotateX(1deg) rotateY(-2deg) translateZ(0px)`,
                  boxShadow: isSimHovered 
                    ? "0 25px 50px -12px rgba(15, 23, 42, 0.45)" 
                    : "0 20px 40px -15px rgba(15, 23, 42, 0.35)",
                  transition: isSimHovered ? "none" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease"
                }}
              >
                
                {/* Simulated Window Control Bar */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/90 border border-rose-600/30"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-600/30"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600/30"></span>
                  </div>
                  <div className="bg-slate-900 border border-slate-850 px-3 py-1 rounded-xs text-[10px] text-slate-400 font-mono w-64 text-center truncate select-none flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>prahari.ai/workspace/gateway-rearchitecture</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest hidden sm:inline-flex items-center gap-1 font-bold">
                    <Maximize2 className="w-2.5 h-2.5" />
                    SIMULATOR
                  </span>
                </div>

                {/* Simulated App Container */}
                <div className="p-6 bg-slate-900 text-left space-y-6">
                  
                  {/* Top: Current Goal details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">Active Monitor Target</span>
                      <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Q3 Analytics Engine Sync</h3>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-sm border border-slate-850">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        In 6 Days
                      </span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span>8 Core Tasks</span>
                    </div>
                  </div>

                  {/* Simulator Control Box */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xs space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/10"></div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 rounded-sm flex items-center justify-center shrink-0">
                        <Sliders className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <span>Interactive Crisis Simulator</span>
                          <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 uppercase rounded-sm">Click below</span>
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          By default, execution metrics indicate normal progress. Trigger a critical blocker to invoke Prahari's AI intervention layer.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900/50 mt-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Interactive element</span>
                      <button
                        id="hero-simulator-trigger"
                        onClick={() => setBlockerTriggered(!blockerTriggered)}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all flex items-center gap-1.5 border-none shadow-xs ${
                          blockerTriggered 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                            : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                        }`}
                      >
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {blockerTriggered ? "Reset Workspace Metrics" : "Trigger Blocker (30h Delay)"}
                      </button>
                    </div>
                  </div>

                  {/* Calculations Block */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3.5 rounded-xs border border-slate-850">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Calculated Risk Index</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-bold font-mono tracking-tight transition-all duration-300 ${
                          blockerTriggered ? "text-rose-500 scale-105" : "text-emerald-500"
                        }`}>
                          {blockerTriggered ? "87%" : "34%"}
                        </span>
                        <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${
                          blockerTriggered ? "text-rose-400 animate-pulse" : "text-emerald-400"
                        }`}>
                          {blockerTriggered ? "CRITICAL" : "HEALTHY"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xs border border-slate-850">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Prahari Backlog Compression</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-bold font-mono tracking-tight transition-colors duration-300 ${
                          blockerTriggered ? "text-amber-400 font-bold" : "text-slate-600"
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
                    <div className="bg-slate-950 border border-amber-500/20 p-4 rounded-xs space-y-3.5 relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-amber-500/5 to-transparent blur-xl pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 font-mono uppercase tracking-tight">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                          <span>Gemini Intervention Strategy</span>
                        </span>
                        <Badge urgency="medium">COMPRESSION LEVEL 1</Badge>
                      </div>

                      <div className="space-y-3 text-left">
                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">1</span>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200">De-prioritize Historical Analytics Charts</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              Postpone complex high-overhead rendering engines. Serve raw JSON export metrics first. Saves 16 engineering hours.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">2</span>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200">Bypass Full Client Integration Testing</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              Leverage simulated JWT workspace stubs temporarily. Restrict live credentials to database sync targets only. Saves 14 engineering hours.
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
                    <div className="p-4 border border-slate-800 bg-slate-950/30 rounded-xs text-center">
                      <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Telemetry indicators standing healthy. Ready for simulation.</span>
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Foreground interactive badge panel (Layered parallax 3D element) */}
              <div 
                className="absolute -bottom-8 -left-6 bg-white border-2 border-slate-950 p-3.5 rounded-xs shadow-xl max-w-xs text-left space-y-1.5 pointer-events-none hidden md:block"
                style={{ 
                  transform: `translate3d(${scrollY * -0.05}px, ${scrollY * -0.09}px, 20px) rotate(1deg)`,
                  transition: "transform 0.1s ease-out"
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Dynamic Risk Shield</span>
                </div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Calculates team velocity slippage under live workloads.</p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. PROBLEM SECTION (SWISS MODERN TYPE RIGID GRID)
          ========================================================================= */}
      <section id="problem-section" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-16 text-left space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">The Procrastination-Crisis Gap</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Reminders tell you what is late.<br />Prahari resolves <span className="text-amber-500">why it's late</span>.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Problem card 1 */}
            <div className="bg-white border-2 border-slate-900 p-7 flex flex-col justify-between rounded-sm shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-sm flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                  <Bell className="w-5 h-5 text-rose-600 animate-pulse" />
                </div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-950">Passive Alarm Fatigue</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Traditional task managers rely on push notifications and passive reminders. When a project slips, they create noise instead of capacity—bombarding you with red alarm indicators without offering viable alternatives.
                </p>
              </div>
              <div className="pt-5 border-t border-slate-100 mt-8 text-[9px] font-mono font-bold text-rose-600 uppercase tracking-widest">
                • Notifications fail passively
              </div>
            </div>

            {/* Problem card 2 */}
            <div className="bg-white border-2 border-slate-900 p-7 flex flex-col justify-between rounded-sm shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-sm flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-950">Decision Paralysis</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Under strict deadlines, builders lose precious momentum trying to negotiate which features are critical and which can be deferred. Priority ambiguity and scope creep are the true killers of Q4 delivery goals.
                </p>
              </div>
              <div className="pt-5 border-t border-slate-100 mt-8 text-[9px] font-mono font-bold text-amber-600 uppercase tracking-widest">
                • Ambiguity halts velocity
              </div>
            </div>

            {/* Problem card 3 (High-Contrast Hero accent) */}
            <div className="bg-slate-900 text-white border-2 border-slate-950 p-7 flex flex-col justify-between rounded-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-slate-800 to-transparent blur-xl pointer-events-none"></div>
              <div className="space-y-4 relative z-10">
                <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-sm flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white">Active AI Intervention</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Prahari AI acts as an active, protective layer. When risk indices rise, it uses Gemini-driven scope models to compress remaining tasks. We isolate a tight, clear Minimum Viable Path so you only execute what's essential.
                </p>
              </div>
              <div className="pt-5 border-t border-slate-800 mt-8 text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest relative z-10">
                • Active de-scoping solution
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS: SYSTEM ARCHITECTURE WALKTHROUGH
          ========================================================================= */}
      <section id="how-it-works-section" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">The Engine Mechanics</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-none">
              Three Stages of Active Security
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              How the Prahari active-sentinel protocol monitors, simplifies, and guards your milestone targets.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 relative">
            
            {/* Step 1 */}
            <div className="space-y-5 text-left relative z-10 bg-slate-50/50 p-6 rounded-sm border border-slate-150 hover:bg-slate-50 transition-all duration-200">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-bold font-mono text-slate-200 tracking-tight leading-none">01</span>
                <Badge urgency="low">Diagnostic Stage</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Velocity Risk Evaluation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  By evaluating current task duration parameters against remaining milestone hours, our risk engine computes a continuous danger score. We project slippages before they disrupt your schedule.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-5 text-left relative z-10 bg-slate-50/50 p-6 rounded-sm border border-slate-150 hover:bg-slate-50 transition-all duration-200">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-bold font-mono text-slate-200 tracking-tight leading-none">02</span>
                <Badge urgency="medium">Gemini Compression</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Tactical Plan Formulation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When risk thresholds breach 75%, Prahari automatically initiates the Gemini engine. It strips secondary scope items (like extensive telemetry, tracking layouts, or secondary modules), rendering a secure survival path.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-5 text-left relative z-10 bg-slate-50/50 p-6 rounded-sm border border-slate-150 hover:bg-slate-50 transition-all duration-200">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-bold font-mono text-slate-200 tracking-tight leading-none">03</span>
                <Badge urgency="high">Execution Lock-In</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Workspace Focus Shields</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We lock your focus onto the compressed checklist path. Utilizing fullscreen focus views, persistent countdown shields, and customizable browser alerts, we prevent distraction loops and preserve delivery velocity.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PRODUCT PREVIEW & LIVE INTERFACE DEMO TABS
          ========================================================================= */}
      <section id="screenshots-section" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-5 space-y-7 text-left">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Workspace Previews</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                  Designed for Calm Engineering Focus
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prahari's layout was designed from the ground up to reduce focus fatigue. Click through the primary interface systems prepared for live database and telemetry feeds.
              </p>

              {/* Tab Toggles */}
              <div className="space-y-3 pt-2">
                <button
                  id="tab-btn-risk"
                  onClick={() => setActivePreviewTab("risk")}
                  className={`w-full text-left p-4 rounded-sm border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    activePreviewTab === "risk"
                      ? "bg-white border-slate-900 shadow-sm"
                      : "bg-transparent border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                    activePreviewTab === "risk" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                  }`}>1</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wider">Risk Diagnostics Board</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Monitor real-time task complexity, available buffers, and computed danger indexes.</p>
                  </div>
                </button>

                <button
                  id="tab-btn-compress"
                  onClick={() => setActivePreviewTab("compress")}
                  className={`w-full text-left p-4 rounded-sm border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    activePreviewTab === "compress"
                      ? "bg-white border-slate-900 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                    activePreviewTab === "compress" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                  }`}>2</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wider">Backlog Scope Compressor</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Review default task parameters side-by-side with Gemini-isolated Minimum Viable Paths.</p>
                  </div>
                </button>

                <button
                  id="tab-btn-execute"
                  onClick={() => setActivePreviewTab("execute")}
                  className={`w-full text-left p-4 rounded-sm border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    activePreviewTab === "execute"
                      ? "bg-white border-slate-900 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                    activePreviewTab === "execute" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                  }`}>3</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-950 uppercase font-mono tracking-wider">High-Integrity Focus Sheet</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Immersive dashboards, countdown shields, and alert metrics that secure execution.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Visual Display Column (Fidelity Interactive Mockups with tilt) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-md border-2 border-slate-900 shadow-xl overflow-hidden p-6 sm:p-8 min-h-[480px] flex flex-col justify-between relative">
                
                {/* Header panel */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                      Prahari Shell System // Active Workspace Preview
                    </span>
                  </div>
                  <Badge urgency={activePreviewTab === "risk" ? "medium" : activePreviewTab === "compress" ? "high" : "low"}>
                    {activePreviewTab === "risk" ? "DIAGNOSTIC TELEMETRY" : activePreviewTab === "compress" ? "AI RESOLUTION ACTIVE" : "LOCK-IN PREPARED"}
                  </Badge>
                </div>

                {/* Sub-panels representing Tab Views */}
                <div className="flex-1 flex flex-col justify-center py-4">
                  
                  {/* TAB 1: RISK DIAGNOSTICS */}
                  {activePreviewTab === "risk" && (
                    <div id="preview-tab-risk-content" className="space-y-6 text-left animate-fade-in">
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xs flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-950 font-mono">CRITICAL RISK ALARM DETECTED</p>
                          <p className="text-[11px] text-rose-800 leading-relaxed mt-1">
                            Q3 compliance migration deadline approaching. Expected developer backlog time exceeds the available margin by 14 hours. Actionable intervention recommended.
                          </p>
                        </div>
                      </div>

                      {/* Velocity metrics list */}
                      <div className="space-y-3 font-sans">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-medium text-slate-600">Monitored Velocity Rate</span>
                          <span className="font-bold font-mono text-slate-900">42 hrs / week</span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-medium text-slate-600">Projected Milestone Overdue Duration</span>
                          <span className="font-bold font-mono text-rose-600">+3.4 days</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pb-1">
                          <span className="font-medium text-slate-600">Calculated Safety Margin Buffer</span>
                          <span className="font-bold font-mono text-amber-600">82% WARNING INDEX</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: COMPRESSOR */}
                  {activePreviewTab === "compress" && (
                    <div id="preview-tab-compress-content" className="space-y-6 text-left animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                          <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Standard Task Scope</span>
                          <p className="text-xs font-bold text-slate-900 font-mono">98 Expected Hours</p>
                          <ul className="text-[10px] text-slate-500 space-y-1 mt-2.5 list-disc pl-3 leading-normal">
                            <li>Re-index client tables</li>
                            <li>Write deep query logs</li>
                            <li>Configure SVG telemetry</li>
                            <li>Build multi-tenant roles</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-sm">
                          <span className="text-[9px] font-mono font-bold text-amber-700 block uppercase mb-1">Minimum Viable Path (MVT)</span>
                          <p className="text-xs font-bold text-slate-950 font-mono">62 Compress Hours</p>
                          <ul className="text-[10px] text-slate-700 space-y-1 mt-2.5 font-bold list-disc pl-3 leading-normal">
                            <li>Re-index client tables</li>
                            <li className="line-through text-slate-400 font-normal">Write deep query logs</li>
                            <li>Configure SVG telemetry</li>
                            <li className="line-through text-slate-400 font-normal">Build multi-tenant roles</li>
                          </ul>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 text-white rounded-xs text-[10.5px] font-mono leading-relaxed">
                        <strong className="text-amber-400">Gemini Directive:</strong> Deferred 36 engineering hours of non-essential reporting configurations and tenant roles to secure database performance schedule.
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FOCUS SHEET */}
                  {activePreviewTab === "execute" && (
                    <div id="preview-tab-execute-content" className="space-y-4 text-left animate-fade-in">
                      <p className="text-xs text-slate-600 leading-relaxed mb-1">
                        Active checklists filter out distraction, keeping teams strictly aligned with the computed Minimum Viable Path.
                      </p>

                      <div className="space-y-2">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4.5 h-4.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                              <Check className="w-3 h-3 text-emerald-750" />
                            </span>
                            <span className="font-medium text-slate-900">Configure core indexing structures</span>
                          </div>
                          <Badge urgency="low">COMPLETED</Badge>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4.5 h-4.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 animate-pulse">
                              2
                            </span>
                            <span className="font-medium text-slate-950 font-bold">Map static data feeds to secondary routes</span>
                          </div>
                          <Badge urgency="medium">ACTIVE STEP</Badge>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-4.5 h-4.5 border border-slate-350 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-slate-400 shrink-0">
                              3
                            </span>
                            <span className="font-medium text-slate-400 line-through">Establish multi-tenant login profiles</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded-sm">DEFERRED</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer details */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 mt-6">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    SANDBOX BLUEPRINT LOADED
                  </span>
                  <span>VERSION 2.5_SHELL</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          5. REAL-WORLD SCENARIO SECTION (WITH MOUSE-TILT HIGHLIGHT CARD)
          ========================================================================= */}
      <section id="scenario-section" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            
            {/* Left Column: Case Study Ledger Block (3D Tilt interaction) */}
            <div 
              className="order-2 lg:order-1"
              onMouseMove={handleCaseMouseMove}
              onMouseEnter={() => setIsCaseHovered(true)}
              onMouseLeave={() => {
                setIsCaseHovered(false);
                setCaseMouse({ x: 0, y: 0 });
              }}
              style={{
                transform: isCaseHovered
                  ? `perspective(1000px) rotateX(${caseMouse.y * -10}deg) rotateY(${caseMouse.x * 10}deg) scale3d(1.01, 1.01, 1.01)`
                  : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
                transition: isCaseHovered ? "none" : "transform 0.4s ease"
              }}
            >
              <div className="bg-slate-50 rounded-sm border-2 border-slate-900 p-8 space-y-6 text-left relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Prahari Case Ledger // Target 401</span>
                  <Badge urgency="high">COMPLIANCE CRITICAL</Badge>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-600 block uppercase">Operational Project Target</span>
                    <p className="text-xs font-bold text-slate-900 font-mono uppercase">User Database GDPR Upgrade</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-600 block uppercase">Critical Blocker Event</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lead database developer falls ill 48 hours before mandatory compliance audit. Backlog workload registers 72 hours of team capacity.
                    </p>
                  </div>

                  {/* Compression comparison metrics */}
                  <div className="p-4.5 bg-slate-900 text-white rounded-xs space-y-3.5 font-mono text-xs border border-slate-950">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Standard task load:</span>
                      <span>72 hours</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold text-[11px]">
                      <span>Prahari Minimum Viable Path:</span>
                      <span>44 hours (-38%)</span>
                    </div>
                    <div className="h-[1px] bg-slate-850 my-2"></div>
                    <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
                      <strong>Resolution Outcome:</strong> Excluded secondary telemetry trackers and analytical exports. Isolated core data encryption, secure query indices, and transaction logs. Audit successfully completed on schedule without engineer burnout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Copywriting Narrative */}
            <div className="space-y-6 text-left order-1 lg:order-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Relatable Incident Study</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                The Compliance Deadline Gate
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Imagine a critical GDPR data upgrade scheduled for a mandatory compliance audit. With 48 hours remaining, the lead database engineer falls ill. Passive task managers will continue sounding alerts, elevating team anxiety levels while milestones slip.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prahari AI intercepts this delay dynamically. By tracking capacity indicators, it isolated the core compliance goals—the secure database hashing and logs—and deferred the high-overhead dashboard exporters. The audit succeeded on time.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Preserves Quality</strong>: Focuses focus purely on core secure deliverables.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Maintains Velocity</strong>: Isolates deferrable work so builders are never bottlenecked.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FINAL CALL TO ACTION SECTION (HIGH CONTRAST SWISS SLATE BAR)
          ========================================================================= */}
      <section id="final-cta-section" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-radial from-slate-800/80 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-white/10 rounded-xs border border-white/20 flex items-center justify-center shadow-lg">
            <Lock className="w-5.5 h-5.5 text-amber-400" />
          </div>

          <div className="space-y-3.5 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Protect your next critical milestone.
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Gain immediate access to the Prahari AI workspace shell. Log in to seed scenarios, activate dynamic compression plans, and configure browser alert alerts.
            </p>
          </div>

          <div>
            <Link id="final-cta-btn" to={LockedRoute.AUTH}>
              <button className="inline-flex items-center gap-2.5 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono rounded-xs transition-all shadow-md cursor-pointer border-none hover:-translate-y-0.5 active:translate-y-0">
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
