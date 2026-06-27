import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  Clock,
  ShieldAlert,
  Sparkles,
  Check,
  Sliders,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { LockedRoute } from "@/config/constants";

// ==========================================
// 1. HIGH-PERFORMANCE INTERSECTION OBSERVER REVEAL HOOK
// ==========================================
function useIntersectionReveal(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [hasRevealed, setHasRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          observer.disconnect(); // Stop observing once triggered
        }
      },
      {
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before full viewport entry
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return [elementRef, hasRevealed];
}

// ==========================================
// 2. ANIMATED COUNTER HOOKS & COMPONENTS
// ==========================================
function AnimatedCounter({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    const start = 0;
    const end = target;
    const totalSteps = 40;
    const stepTime = duration / totalSteps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      const easedProgress = progress * (2 - progress); // Ease-out quadratic
      const current = Math.floor(start + easedProgress * (end - start));
      
      setCount(current);

      if (step >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return (
    <span ref={elementRef} className="tabular-nums font-serif">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function AnimatedDecimalCounter({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    const start = 0;
    const end = target;
    const totalSteps = 40;
    const stepTime = duration / totalSteps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      const easedProgress = progress * (2 - progress);
      const current = start + easedProgress * (end - start);
      
      setCount(current);

      if (step >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return (
    <span ref={elementRef} className="tabular-nums font-serif">
      {count.toFixed(1)}
      {suffix}
    </span>
  );
}

// ==========================================
// 3. MAIN LANDING PAGE COMPONENT
// ==========================================
export function LandingPage() {
  const navigate = useNavigate();

  // Smooth scroll handler to stay in React Single-Page Application mode
  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // State for interactive simulator (Section 1 / right panel)
  const [isSimulatorHovered, setIsSimulatorHovered] = useState(false);
  const [simulatorMouse, setSimulatorMouse] = useState({ x: 0, y: 0 });
  const [blockerTriggered, setBlockerTriggered] = useState(true); // Default to Critical state for dramatic impact

  // States for hovering the Section 5 Product panels to trigger flattering rotation corrections
  const [hoveredPanelA, setHoveredPanelA] = useState(false);
  const [hoveredPanelB, setHoveredPanelB] = useState(false);
  const [hoveredPanelC, setHoveredPanelC] = useState(false);

  const handleSimulatorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; // Disable on mobile devices
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // Scale from -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setSimulatorMouse({ x, y });
  };

  // Section visibility trackers (Intersection Observer reveals)
  const [tensionStripRef, isTensionStripVisible] = useIntersectionReveal();
  const [problemSectionRef, isProblemSectionVisible] = useIntersectionReveal();
  const [stagesSectionRef, isStagesSectionVisible] = useIntersectionReveal();
  const [previewSectionRef, isPreviewSectionVisible] = useIntersectionReveal();
  const [scenarioSectionRef, isScenarioSectionVisible] = useIntersectionReveal();
  const [trustSectionRef, isTrustSectionVisible] = useIntersectionReveal();

  return (
    <div
      id="landing-root"
      className="bg-[#f9f8f5] text-[#28251d] font-sans antialiased selection:bg-[#01696f]/10 selection:text-[#01696f] overflow-x-hidden min-h-screen flex flex-col"
    >
      {/* PREMIUM MINIMAL CUSTOM HEADER */}
      <header className="sticky top-0 z-50 bg-[#f9f8f5]/90 backdrop-blur-md border-b border-[#28251d]/12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-18 flex items-center justify-between">
          <Link
            to={LockedRoute.LANDING}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-8 h-8 bg-[#01696f] flex items-center justify-center rounded-sm transition-transform duration-300 group-hover:scale-105">
              <Shield className="w-4.5 h-4.5 text-[#f9f8f5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif font-bold text-lg tracking-tight leading-none text-[#28251d]">
                Prahari AI
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#7a7974] uppercase mt-1">
                Active Milestone Shield
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToId("how-it-works-stages")}
              className="text-xs uppercase font-mono tracking-wider font-semibold text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer border-none bg-transparent"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToId("product-preview-stack")}
              className="text-xs uppercase font-mono tracking-wider font-semibold text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer border-none bg-transparent"
            >
              System View
            </button>
            <button
              onClick={() => scrollToId("scenario-case-study")}
              className="text-xs uppercase font-mono tracking-wider font-semibold text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer border-none bg-transparent"
            >
              Case Study
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(LockedRoute.AUTH)}
              className="text-xs uppercase font-mono tracking-wider font-bold bg-[#01696f] hover:bg-[#005156] text-white px-5 py-2.5 rounded-sm transition-all shadow-xs hover:-translate-y-0.5 hover:shadow-md cursor-pointer border-none"
            >
              Login / Register
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1 — HERO SECTION
          ========================================================================= */}
      <section
        id="hero-section"
        className="relative py-16 sm:py-24 overflow-hidden flex items-center min-h-[85vh] border-b border-[#28251d]/12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* LEFT COLUMN: HERO HEADLINE */}
            <div className="lg:col-span-6 space-y-8 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#01696f]/5 border border-[#01696f]/15 rounded-full text-[#01696f] text-[10px] font-mono uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#01696f] animate-pulse"></span>
                <span>Sentinel Protocol Active</span>
              </div>

              <h1
                className="font-serif font-bold text-[#28251d] tracking-tight leading-[1.05] animate-clip-reveal text-left"
                style={{ fontSize: "clamp(2.5rem, 1rem + 5.5vw, 4.8rem)" }}
              >
                Deadlines don't fail suddenly.
              </h1>

              <p className="text-lg sm:text-xl text-[#7a7974] font-medium leading-relaxed max-w-xl text-left font-sans">
                They fail quietly — one unfinished block at a time.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
                <button
                  id="hero-get-started"
                  onClick={() => navigate(LockedRoute.AUTH)}
                  className="bg-[#01696f] hover:bg-[#005156] text-[#f9f8f5] font-sans font-semibold text-sm px-8 py-4 rounded-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-[2px] cursor-pointer border-none flex items-center justify-center gap-2.5 group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  id="hero-see-works"
                  onClick={() => scrollToId("how-it-works-stages")}
                  className="bg-transparent hover:bg-[#01696f]/5 text-[#01696f] border border-[#01696f]/20 hover:border-[#01696f]/40 font-sans font-semibold text-sm px-8 py-4 rounded-sm transition-all cursor-pointer flex items-center justify-center"
                >
                  See How It Works
                </button>
              </div>

              <div className="pt-4 flex flex-wrap gap-x-6 gap-y-3 items-center text-[11px] text-[#7a7974] font-mono border-t border-[#28251d]/10 w-full">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#437a22]"></span>
                  VELOCITY METRIC FEED
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#437a22]"></span>
                  GEMINI 2.5 ADAPTIVE ENGINE
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#437a22]"></span>
                  FIRESTORE DURABLE STORAGE
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: 3D-TILTED INTERACTIVE PRODUCT SCREENSHOT */}
            <div className="lg:col-span-6 flex flex-col justify-center relative">
              <div className="absolute -top-8 -left-8 w-32 h-32 border-l border-t border-[#28251d]/10 pointer-events-none rounded-tl-sm hidden sm:block"></div>

              <div
                onMouseMove={handleSimulatorMouseMove}
                onMouseEnter={() => setIsSimulatorHovered(true)}
                onMouseLeave={() => {
                  setIsSimulatorHovered(false);
                  setSimulatorMouse({ x: 0, y: 0 });
                }}
                className="bg-[#f3f0ec] rounded-sm border border-[#28251d]/12 p-6 sm:p-7 shadow-xl w-full max-w-lg mx-auto relative transition-all duration-300"
                style={{
                  transform: isSimulatorHovered
                    ? `perspective(1200px) rotateY(${simulatorMouse.x * 12}deg) rotateX(${
                        simulatorMouse.y * -12
                      }deg) scale(1.02)`
                    : `perspective(1200px) rotateY(-8deg) rotateX(3deg) scale(1)`,
                  transition: isSimulatorHovered
                    ? "none"
                    : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), shadow 0.4s ease",
                  boxShadow: isSimulatorHovered
                    ? "0 30px 60px -15px rgba(40, 37, 29, 0.15)"
                    : "0 15px 35px -10px rgba(40, 37, 29, 0.08)",
                }}
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#28251d]/10 mb-5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]/30 border border-[#dc2626]/40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]/30 border border-[#d97706]/40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#437a22]/30 border border-[#437a22]/40"></span>
                  </div>
                  <div className="bg-[#f9f8f5] px-4 py-1 border border-[#28251d]/10 text-[9px] font-mono text-[#7a7974] rounded-sm truncate w-48 text-center">
                    prahari.ai/shell/monitoring
                  </div>
                  <span className="text-[9px] font-mono text-[#7a7974] tracking-wider uppercase font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-ping"></span>
                    Live Shield
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#7a7974] uppercase tracking-wider block">
                        Crisis Containment Monitor
                      </span>
                      <h3 className="font-serif font-bold text-lg text-[#28251d] mt-1">
                        Submit Final Audit Report
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-sm uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse"></span>
                      Critical Risk
                    </span>
                  </div>

                  <div className="p-4 bg-[#f9f8f5] border border-[#28251d]/12 rounded-sm space-y-3 text-left">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#7a7974]">Time Remaining:</span>
                      <span className="font-bold text-[#dc2626] flex items-center gap-1 bg-[#dc2626]/5 px-2 py-0.5 rounded-xs border border-[#dc2626]/12">
                        <Clock className="w-3.5 h-3.5" />
                        Due in 4h 22m
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#28251d]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#dc2626] rounded-full w-[85%] animate-pulse"></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#7a7974] font-mono">
                      <span>Completion Velocity Slippage</span>
                      <span className="font-bold text-[#dc2626]">
                        +18 Hours behind
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#01696f]/5 border border-[#01696f]/15 rounded-sm flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#01696f] uppercase">
                      Interactive Trigger
                    </span>
                    <button
                      onClick={() => setBlockerTriggered(!blockerTriggered)}
                      className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-sm border-none transition-all cursor-pointer shadow-xs ${
                        blockerTriggered
                          ? "bg-[#01696f] hover:bg-[#005156] text-white"
                          : "bg-[#d97706] hover:bg-[#b25e00] text-white"
                      }`}
                    >
                      {blockerTriggered
                        ? "Review De-Scoping Outcome"
                        : "Mock Blocker Event (30h Delay)"}
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-500 overflow-hidden ${
                      blockerTriggered
                        ? "max-h-72 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-4 bg-[#28251d] text-[#f9f8f5] rounded-sm space-y-3 border border-[#28251d] text-left">
                      <div className="flex items-center justify-between border-b border-[#f9f8f5]/15 pb-2">
                        <span className="text-[10px] font-mono font-bold text-[#01696f] tracking-widest uppercase flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-[#01696f] animate-bounce" />
                          Gemini Active Rescue Path
                        </span>
                        <span className="text-[9px] font-mono bg-[#01696f] text-white px-1.5 py-0.5 rounded-xs uppercase tracking-wider font-bold">
                          -38% Scope Reduced
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5 text-xs font-sans">
                          <Check className="w-4 h-4 text-[#01696f] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#f9f8f5]">
                              Defer Analytical Dashboard Configs
                            </p>
                            <p className="text-[10px] text-[#7a7974] mt-0.5">
                              Saves 16 hours by prioritizing raw metric
                              collection tables first.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs font-sans">
                          <Check className="w-4 h-4 text-[#01696f] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#f9f8f5]">
                              Lock Workspace to Core Index Pipeline
                            </p>
                            <p className="text-[10px] text-[#7a7974] mt-0.5">
                              Automated Focus Shields blocks background noise
                              notifications.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(LockedRoute.AUTH)}
                    className="w-full py-3.5 bg-transparent hover:bg-[#01696f] text-[#d97706] hover:text-white font-mono font-bold text-xs uppercase tracking-wider border border-[#d97706] hover:border-[#01696f] transition-all rounded-sm cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>Rescue Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-4 bg-[#f9f8f5] border border-[#28251d]/12 p-4 rounded-sm shadow-lg max-w-xs text-left hidden md:block">
                <div className="flex items-center gap-2 text-[#01696f]">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    Dynamic Risk Shield
                  </span>
                </div>
                <p className="text-xs text-[#28251d] font-semibold mt-1.5 leading-tight">
                  Tracks workspace progress patterns to block distraction and
                  preserve velocity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — TENSION STRIP
          ========================================================================= */}
      <section
        ref={tensionStripRef}
        className="py-12 bg-[#f3f0ec] border-b border-[#28251d]/12 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="h-[1px] bg-[#28251d]/12 w-full mb-8"></div>

          <div
            className={`text-center py-6 overflow-hidden ${
              isTensionStripVisible ? "wipe-text-visible" : "wipe-text-hidden"
            }`}
          >
            <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-[#28251d] tracking-tight leading-relaxed select-none max-w-4xl mx-auto">
              "Every missed deadline started as a task someone was going to do
              later."
            </p>
          </div>

          <div className="h-[1px] bg-[#28251d]/12 w-full mt-8"></div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — THE PROBLEM
          ========================================================================= */}
      <section
        ref={problemSectionRef}
        className="py-20 sm:py-28 bg-[#f9f8f5] border-b border-[#28251d]/12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] block">
                The Core Conflict
              </span>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#28251d] tracking-tight leading-tight">
                The tools you use trust you to remember.
              </h2>
              <div className="space-y-4 text-[#7a7974] font-sans text-base leading-relaxed">
                <p>
                  Traditional project managers act as passive ledgers. They
                  expect you to manually log progress, map dependencies, and
                  self-regulate your velocity. When things slip, they send noisy
                  alerts—alerting you to failure without creating a single hour
                  of capacity.
                </p>
                <p>
                  Prahari operates on an active intervention model. Instead of
                  passive monitoring, it evaluates team output against calendar
                  buffers in real-time. When critical danger scales cross 75%,
                  Prahari uses Gemini intelligence to automatically compress
                  backlogs into a tight, viable delivery path.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md relative pl-6 space-y-12">
                <div className="absolute left-10.5 top-2 bottom-2 w-[1px] border-l border-dashed border-[#28251d]/20 z-0"></div>

                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-9 h-9 bg-[#f9f8f5] border border-[#28251d]/12 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7a7974]"></span>
                  </div>
                  <div className="text-left py-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7974] font-bold">
                      State 01
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#28251d] mt-0.5">
                      Task Logged
                    </h4>
                    <p className="text-xs text-[#7a7974] mt-1">
                      Teams set milestones and commit to full initial scopes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-9 h-9 bg-[#f9f8f5] border border-[#d97706]/40 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] animate-pulse"></span>
                  </div>
                  <div className="text-left py-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#d97706] font-bold">
                      State 02 // Velocity Warning
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#28251d] mt-0.5 flex items-center gap-1.5">
                      Slippage Approaching
                      <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20 rounded-sm">
                        AT-RISK
                      </span>
                    </h4>
                    <p className="text-xs text-[#7a7974] mt-1">
                      Telemetry flags high workload friction. Safety buffer
                      narrows below 20%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-9 h-9 bg-[#f9f8f5] border border-[#dc2626]/40 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-ping"></span>
                  </div>
                  <div className="text-left py-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#dc2626] font-bold">
                      State 03 // Critical Breach
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#28251d] mt-0.5 flex items-center gap-1.5">
                      Milestone Compression Initiated
                      <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-sm">
                        CRITICAL
                      </span>
                    </h4>
                    <p className="text-xs text-[#7a7974] mt-1">
                      Buffer reaches 0. Prahari actively locks work environment
                      down to essential deliverables.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — THREE STAGES OF INTERVENTION
          ========================================================================= */}
      <section
        id="how-it-works-stages"
        ref={stagesSectionRef}
        className="py-20 sm:py-28 bg-[#f3f0ec] border-b border-[#28251d]/12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-16 sm:mb-24 text-left">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] block">
              Active Sentinel Protocol
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#28251d] tracking-tight mt-1">
              How Prahari Intervenes
            </h2>
          </div>

          <div className="space-y-16 md:space-y-24 relative">
            <div
              className={`grid md:grid-cols-12 gap-6 items-start transition-all duration-700 relative group text-left ${
                isStagesSectionVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="md:col-span-3 flex items-baseline gap-4 md:flex-col md:gap-0">
                <span className="font-serif font-bold text-5xl sm:text-6xl text-[#01696f]">
                  01
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#01696f] uppercase block md:mt-2 bg-[#01696f]/5 px-2 py-0.5 rounded-sm border border-[#01696f]/15">
                  DIAGNOSTIC STAGE
                </span>
              </div>
              <div className="md:col-span-9 relative pl-6 py-2">
                <span className="absolute left-0 top-0 w-[2px] h-0 bg-[#01696f] transition-all duration-300 group-hover:h-full"></span>
                <span className="absolute left-0 top-0 w-[2px] h-full bg-[#28251d]/12 -z-10"></span>

                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#28251d]">
                  Velocity Risk Evaluation
                </h3>
                <p className="text-[#7a7974] text-base mt-2.5 max-w-2xl leading-relaxed">
                  The diagnostics monitor runs persistently in your workspace
                  shell. By continuously analyzing developer output against
                  actual time calendars and milestone deadlines, Prahari
                  calculates a precise danger score. We identify bottlenecks and
                  slippages before they occur.
                </p>
              </div>
            </div>

            <div
              className={`grid md:grid-cols-12 gap-6 items-start transition-all duration-700 relative group text-left md:pl-[100px] ${
                isStagesSectionVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-10"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              <div className="md:col-span-3 flex items-baseline gap-4 md:flex-col md:gap-0">
                <span className="font-serif font-bold text-5xl sm:text-6xl text-[#01696f]">
                  02
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#01696f] uppercase block md:mt-2 bg-[#01696f]/5 px-2 py-0.5 rounded-sm border border-[#01696f]/15">
                  GEMINI COMPRESSION
                </span>
              </div>
              <div className="md:col-span-9 relative pl-6 py-2">
                <span className="absolute left-0 top-0 w-[2px] h-0 bg-[#01696f] transition-all duration-300 group-hover:h-full"></span>
                <span className="absolute left-0 top-0 w-[2px] h-full bg-[#28251d]/12 -z-10"></span>

                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#28251d]">
                  Tactical Plan Formulation
                </h3>
                <p className="text-[#7a7974] text-base mt-2.5 max-w-2xl leading-relaxed">
                  When risk thresholds breach critical levels, the Prahari
                  Active Engine initializes backlog compression. Leveraging
                  Gemini capabilities, the system systematically prunes
                  secondary telemetry widgets and non-essential modules to
                  deliver a realistic, high-velocity Minimum Viable Path.
                </p>
              </div>
            </div>

            <div
              className={`grid md:grid-cols-12 gap-6 items-start transition-all duration-700 relative group text-left md:pl-[200px] ${
                isStagesSectionVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-10"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              <div className="md:col-span-3 flex items-baseline gap-4 md:flex-col md:gap-0">
                <span className="font-serif font-bold text-5xl sm:text-6xl text-[#01696f]">
                  03
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#01696f] uppercase block md:mt-2 bg-[#01696f]/5 px-2 py-0.5 rounded-sm border border-[#01696f]/15">
                  EXECUTION LOCK-IN
                </span>
              </div>
              <div className="md:col-span-9 relative pl-6 py-2">
                <span className="absolute left-0 top-0 w-[2px] h-0 bg-[#01696f] transition-all duration-300 group-hover:h-full"></span>
                <span className="absolute left-0 top-0 w-[2px] h-full bg-[#28251d]/12 -z-10"></span>

                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#28251d]">
                  Workspace Focus Shield
                </h3>
                <p className="text-[#7a7974] text-base mt-2.5 max-w-2xl leading-relaxed">
                  We lock your attention onto the calculated Minimum Viable Path
                  checklist. By launching immersive dashboard timers, persistent
                  full-viewport countdown shields, and automated notifications
                  blocks, Prahari completely eliminates task navigation
                  distraction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — PRODUCT PREVIEW
          ========================================================================= */}
      <section
        id="product-preview-stack"
        ref={previewSectionRef}
        className="py-20 sm:py-28 bg-[#f9f8f5] border-b border-[#28251d]/12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 text-left space-y-6">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] block">
                Visual Shell Previews
              </span>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#28251d] tracking-tight leading-tight">
                Built for the Final 72 Hours
              </h2>
              <p className="text-[#7a7974] text-base leading-relaxed">
                Prahari’s workspace layouts are clean, high-contrast, and
                hyper-focused. Every pixel is engineered to avoid alert clutter
                and highlight the singular next task that guarantees milestone
                survival.
              </p>
              <div className="p-4 bg-[#f3f0ec] border border-[#28251d]/12 rounded-sm text-xs font-mono text-[#7a7974] flex items-start gap-3">
                <Sliders className="w-4.5 h-4.5 text-[#01696f] shrink-0 mt-0.5" />
                <span>
                  <strong>Interactive Stack</strong>: Hover over the individual
                  cards in the panel grid to flatten them and observe deep
                  telemetry, active compression workflows, and focus locks.
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 h-[520px] sm:h-[580px] relative mt-10 lg:mt-0 select-none">
              <div
                onMouseEnter={() => setHoveredPanelA(true)}
                onMouseLeave={() => setHoveredPanelA(false)}
                className="absolute top-0 left-0 w-[85%] sm:w-[80%] bg-[#f3f0ec] rounded-sm border border-[#28251d]/12 p-5 shadow-lg transition-all duration-500 ease-out text-left"
                style={{
                  transform: isPreviewSectionVisible
                    ? `perspective(1000px) translate3d(0, 0, 40px) rotateY(${
                        hoveredPanelA ? "0deg" : "-6deg"
                      })`
                    : `perspective(1000px) translate3d(-100px, 80px, -60px) rotateY(-18deg)`,
                  opacity: isPreviewSectionVisible ? 1 : 0,
                  zIndex: hoveredPanelA ? 40 : 30,
                }}
              >
                <div className="flex items-center justify-between border-b border-[#28251d]/10 pb-3 mb-4">
                  <span className="text-[10px] font-mono uppercase text-[#7a7974] font-bold">
                    Panel A // Diagnostics
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-xs">
                    CRITICAL RISK INDEX
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#28251d] font-bold">
                      1. Submit Q3 Compliance Audit
                    </span>
                    <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-xs uppercase">
                      CRITICAL
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#28251d] font-medium">
                      2. Map Telemetry Data Pipelines
                    </span>
                    <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20 rounded-xs uppercase">
                      AT-RISK
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#7a7974] line-through">
                      3. Configure Database Encryption
                    </span>
                    <span className="px-1.5 py-0.5 text-[8px] font-mono bg-[#437a22]/10 text-[#437a22] border border-[#437a22]/20 rounded-xs uppercase">
                      HEALTHY
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#28251d]/10 flex items-center justify-between text-[10px] font-mono text-[#7a7974]">
                  <span>Risk: 82% Breach Projection</span>
                  <span>Safety Margin: 3.4h left</span>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredPanelB(true)}
                onMouseLeave={() => setHoveredPanelB(false)}
                className="absolute top-28 left-8 sm:left-14 w-[85%] sm:w-[80%] bg-[#f9f8f5] rounded-sm border border-[#28251d]/12 p-5 shadow-lg transition-all duration-500 ease-out text-left"
                style={{
                  transform: isPreviewSectionVisible
                    ? `perspective(1000px) translate3d(20px, 20px, 20px) rotateY(${
                        hoveredPanelB ? "0deg" : "-6deg"
                      })`
                    : `perspective(1000px) translate3d(40px, 160px, -90px) rotateY(-18deg)`,
                  opacity: isPreviewSectionVisible ? 1 : 0,
                  transitionDelay: "150ms",
                  zIndex: hoveredPanelB ? 40 : 20,
                }}
              >
                <div className="flex items-center justify-between border-b border-[#28251d]/10 pb-3 mb-4">
                  <span className="text-[10px] font-mono uppercase text-[#7a7974] font-bold">
                    Panel B // Rescue Plan
                  </span>
                  <span className="text-xs font-mono font-bold text-[#01696f]">
                    MVT COMPRESSION LEVEL 2
                  </span>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#437a22]/10 text-[#437a22] flex items-center justify-center font-mono text-[9px] font-bold border border-[#437a22]/20">
                      ✓
                    </span>
                    <span className="text-[#7a7974] line-through">
                      Establish core encrypted database structures
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#437a22]/10 text-[#437a22] flex items-center justify-center font-mono text-[9px] font-bold border border-[#437a22]/20">
                      ✓
                    </span>
                    <span className="text-[#7a7974] line-through">
                      Establish multi-tenant login profiles
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#01696f]/10 text-[#01696f] flex items-center justify-center font-mono text-[9px] font-bold border border-[#01696f]/20 animate-pulse">
                      3
                    </span>
                    <span className="text-[#28251d] font-bold">
                      Isolate transaction schemas and secure query logs
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-[10px] font-mono text-[#7a7974] mb-1.5">
                    <span>Active Progress</span>
                    <span>50% Complete</span>
                  </div>
                  <div className="h-1.5 bg-[#28251d]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#01696f] rounded-full w-1/2"></div>
                  </div>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredPanelC(true)}
                onMouseLeave={() => setHoveredPanelC(false)}
                className="absolute top-56 left-16 sm:left-28 w-[85%] sm:w-[80%] bg-[#28251d] text-[#f9f8f5] rounded-sm border border-[#28251d]/12 p-5 shadow-xl transition-all duration-500 ease-out text-left"
                style={{
                  transform: isPreviewSectionVisible
                    ? `perspective(1000px) translate3d(40px, 40px, 0px) rotateY(${
                        hoveredPanelC ? "0deg" : "-6deg"
                      })`
                    : `perspective(1000px) translate3d(150px, 240px, -120px) rotateY(-18deg)`,
                  opacity: isPreviewSectionVisible ? 1 : 0,
                  transitionDelay: "300ms",
                  zIndex: hoveredPanelC ? 40 : 10,
                }}
              >
                <div className="flex items-center justify-between border-b border-[#f9f8f5]/15 pb-3 mb-4">
                  <span className="text-[10px] font-mono uppercase text-[#7a7974] font-bold">
                    Panel C // Compression Yield
                  </span>
                  <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#01696f]/20 text-[#01696f] border border-[#01696f]/30 rounded-xs uppercase">
                    RESOLVED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5 p-3 bg-[#f9f8f5]/5 rounded-sm">
                    <span className="text-[9px] text-[#7a7974] uppercase font-bold block">
                      Standard Path
                    </span>
                    <p className="text-sm font-bold text-[#f9f8f5]">
                      6 Tasks / 4h
                    </p>
                    <p className="text-[10px] text-[#7a7974]">
                      Full complex telemetry modules
                    </p>
                  </div>
                  <div className="space-y-1.5 p-3 bg-[#01696f]/15 rounded-sm border border-[#01696f]/20">
                    <span className="text-[9px] text-[#01696f] uppercase font-bold block">
                      Minimum Viable Path
                    </span>
                    <p className="text-sm font-bold text-[#01696f]">
                      3 Tasks / 1h 45m
                    </p>
                    <p className="text-[10px] text-[#7a7974]">
                      Pruned to core data structures
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#7a7974]">
                    Gemini reduction score:
                  </span>
                  <span className="font-bold text-[#01696f] bg-[#01696f]/15 border border-[#01696f]/20 px-2 py-0.5 rounded-xs">
                    -38% De-scoped
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — SCENARIO STORY
          ========================================================================= */}
      <section
        id="scenario-case-study"
        ref={scenarioSectionRef}
        className="py-20 sm:py-28 bg-[#f9f8f5] border-b border-[#28251d]/12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div
              className="lg:col-span-6 order-2 lg:order-1 transition-all duration-700 ease-out"
              style={{
                transform: isScenarioSectionVisible
                  ? "translateY(0)"
                  : "translateY(30px)",
                opacity: isScenarioSectionVisible ? 1 : 0,
              }}
            >
              <div className="bg-[#f3f0ec] rounded-sm border border-[#28251d]/12 p-6 sm:p-8 space-y-6 text-left relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-[#28251d]/12 pb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#7a7974]">
                    Operational Study // Scenario 401
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-xs">
                    COMPLIANCE CRITICAL
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#01696f] block uppercase tracking-wider">
                      PROJECT GOAL TARGET
                    </span>
                    <p className="text-sm font-bold text-[#28251d] font-mono uppercase tracking-tight">
                      User Database GDPR Upgrade
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#01696f] block uppercase tracking-wider">
                      CRITICAL BLOCKER INCIDENT
                    </span>
                    <p className="text-xs text-[#7a7974] leading-relaxed">
                      Lead database systems developer falls ill 48 hours before
                      the compliance audit deadline. Backlog workload registers
                      72 engineering capacity hours remaining.
                    </p>
                  </div>

                  <div className="p-4 bg-[#28251d] text-[#f9f8f5] rounded-sm space-y-3 font-mono text-xs border border-[#28251d]">
                    <div className="flex justify-between text-[#7a7974] text-[10px] uppercase font-bold">
                      <span>Standard Scope Target:</span>
                      <span>72 Hours</span>
                    </div>
                    <div className="flex justify-between text-[#01696f] font-bold text-[10px] uppercase">
                      <span>Prahari Minimum Viable Path:</span>
                      <span>44 Hours</span>
                    </div>
                    <div className="h-[1px] bg-[#f9f8f5]/15 my-1.5"></div>
                    <p className="text-[11px] text-[#7a7974] font-sans leading-relaxed">
                      <strong>Intervention Outcome:</strong> Excluded optional
                      visual data exporters. Locked developer workspace
                      exclusively to backend database hashing and secure
                      transaction logs. Audit successfully completed without
                      engineer exhaustion.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] block">
                Relatable Narrative
              </span>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#28251d] tracking-tight leading-tight">
                The Compliance Deadline Gate
              </h2>
              <div className="space-y-4 text-base text-[#7a7974] leading-relaxed font-sans">
                <p>
                  Imagine a scheduled compliance audit with critical financial
                  penalties. With less than forty-eight hours left on the
                  ledger, your primary database lead falls ill. Normal
                  notification trackers will continue firing warnings, raising
                  team anxiety without offering a single logical route.
                </p>
                <p>
                  Prahari AI intercepts this delay. By continuously monitoring
                  your sprint, it automatically isolated the core compliance
                  goals—the secure database encryption and logging blocks—and
                  deferred secondary metric graphing setups. The team
                  successfully delivered the audit criteria on schedule.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#28251d]/10">
                <div className="flex items-center gap-2.5 text-xs text-[#28251d] font-bold">
                  <CheckCircle2 className="w-5 h-5 text-[#01696f] shrink-0" />
                  <span>Preserves Quality</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#28251d] font-bold">
                  <CheckCircle2 className="w-5 h-5 text-[#01696f] shrink-0" />
                  <span>Maintains Velocity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7 — SOCIAL PROOF / TRUST STRIP
          ========================================================================= */}
      <section
        ref={trustSectionRef}
        className="py-16 sm:py-20 bg-[#f9f8f5] border-b border-[#28251d]/12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-3 gap-10 items-start text-left">
            <div className="group relative pb-4 cursor-pointer">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-[#28251d] flex items-baseline">
                <AnimatedCounter target={10000} suffix="+" />
              </div>
              <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] mt-3">
                Deadlines Analyzed & Secured
              </p>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#01696f] transition-all duration-300 group-hover:w-full"></span>
            </div>

            <div className="group relative pb-4 cursor-pointer">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-[#28251d] flex items-baseline">
                <AnimatedCounter target={94} suffix="%" />
              </div>
              <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] mt-3">
                Risk Detection Accuracy Rate
              </p>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#01696f] transition-all duration-300 group-hover:w-full"></span>
            </div>

            <div className="group relative pb-4 cursor-pointer">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-[#28251d] flex items-baseline">
                <AnimatedDecimalCounter target={3.2} suffix="×" />
              </div>
              <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7a7974] mt-3">
                Faster Target Milestone Resolution
              </p>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#01696f] transition-all duration-300 group-hover:w-full"></span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8 — FINAL CALL TO ACTION
          ========================================================================= */}
      <section
        id="final-cta-section"
        className="py-20 sm:py-28 bg-[#f3f0ec] relative overflow-hidden border-b border-[#28251d]/12"
      >
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 sm:px-8 relative z-10 text-center space-y-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-[#01696f]/10 rounded-sm border border-[#01696f]/20 flex items-center justify-center shadow-md">
            <Lock className="w-5.5 h-5.5 text-[#01696f]" />
          </div>

          <div className="space-y-3.5 max-w-xl">
            <h2 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#28251d] tracking-tight">
              Protect your next critical milestone.
            </h2>
            <p className="text-[#7a7974] text-sm sm:text-base leading-relaxed">
              Activate the Prahari Active Engine in your workspace today.
              Integrate raw metrics feeds, de-scope deliverables with Gemini,
              and lock attention to what secures target completion.
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate(LockedRoute.AUTH)}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#01696f] hover:bg-[#005156] text-white font-bold text-sm uppercase tracking-wider font-mono rounded-full transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg cursor-pointer border-none"
            >
              Initialize Workspace Shell
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <p className="text-[11px] text-[#7a7974] font-mono mt-4">
              No credit card required. Free tier. Judge-demo ready.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER SECTION
          ========================================================================= */}
      <footer className="bg-[#f9f8f5] py-14 border-t border-[#28251d]/12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-12 gap-10 text-left items-start">
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-[#01696f] flex items-center justify-center rounded-sm">
                  <Shield className="w-4 h-4 text-[#f9f8f5]" />
                </div>
                <span className="font-serif font-bold text-lg text-[#28251d] tracking-tight">
                  Prahari AI
                </span>
              </div>
              <p className="text-xs text-[#7a7974] leading-relaxed max-w-sm">
                Prahari AI is a proactive, secure sentinel system designed to
                analyze developer velocity, de-scope high-overhead blockers, and
                secure delivery schedules.
              </p>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h5 className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#28251d]">
                Product Shell
              </h5>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    onClick={() => scrollToId("how-it-works-stages")}
                    className="text-[#7a7974] hover:text-[#01696f] transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    Active Sentinel Protocol
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToId("product-preview-stack")}
                    className="text-[#7a7974] hover:text-[#01696f] transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    Product Preview Stack
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToId("scenario-case-study")}
                    className="text-[#7a7974] hover:text-[#01696f] transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    GDPR Study Scenario
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h5 className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#28251d]">
                System Meta
              </h5>
              <ul className="space-y-2.5 text-xs text-[#7a7974]">
                <li>
                  <span className="block">Version: 2.5_PRO_SHELL</span>
                </li>
                <li>
                  <span className="block">Durable State: Firestore DB</span>
                </li>
                <li>
                  <span className="block">Intel Layer: Gemini 2.5 SDK</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#28251d]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#7a7974]">
            <p>© {new Date().getFullYear()} Prahari AI. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-[#01696f] transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-[#01696f] transition-colors">
                Terms of Service
              </a>
              <a
                href="#compliance"
                className="hover:text-[#01696f] transition-colors"
              >
                Compliance Audit
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
