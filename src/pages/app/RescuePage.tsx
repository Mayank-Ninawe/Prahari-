import React, { useState } from "react";
import { Sparkles, ShieldCheck, Scale, RefreshCw, Layers, ShieldAlert, ArrowRight, Zap, Play, Target, ChevronRight, Check } from "lucide-react";
import { GeminiService, AIRiskAssessment, AIRescuePlan } from "../../services/gemini";
import { Card, Badge, Input, TextArea, SectionHeader, Button } from "../../components/ui/BaseComponents";

export function RescuePage() {
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [assessment, setAssessment] = useState<AIRiskAssessment | null>(null);
  const [plan, setPlan] = useState<AIRescuePlan | null>(null);

  const loadingMessages = [
    "Establishing secure workspace token bridge...",
    "Scanning milestones for historical project team velocity slippages...",
    "Initializing Gemini-flash models for structural scope compression...",
    "Computing optimal scope mitigation ratios and critical task pathways...",
    "Formulating action-oriented, non-fatiguing playbooks..."
  ];

  const handleRescueSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !deadline) return;

    setIsLoading(true);
    setLoadingStep(0);
    setAssessment(null);
    setPlan(null);

    // Simulate step-by-step diagnostic updates
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    try {
      // Trigger full-stack client-to-server proxy calls
      const [riskRes, planRes] = await Promise.all([
        GeminiService.assessProjectRisk(projectTitle, description, deadline),
        GeminiService.generateRescuePlan(projectTitle, description, deadline)
      ]);

      // Delay to let the user review the progress telemetry steps comfortably
      await new Promise((resolve) => setTimeout(resolve, 4000));

      setAssessment(riskRes);
      setPlan(planRes);
    } catch (err) {
      console.error("Rescue generation error:", err);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const resetRescue = () => {
    setProjectTitle("");
    setDescription("");
    setDeadline("");
    setAssessment(null);
    setPlan(null);
  };

  return (
    <div id="rescue-page-root" className="space-y-8 font-sans max-w-4xl mx-auto text-left animate-fade-in">
      
      {/* 1. EDITORIAL HEADER */}
      <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Badge urgency="medium">Rescue Protocol</Badge>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-400 font-mono">CALM URGENCY MECHANISM</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
          Deploy Milestone Protection
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Unlike generic chatbot agents, Prahari AI executes precise scope compressions. By inputting slipping targets or major blockers, the calculation engine isolates your **Minimum Viable Path** to secure key target boundaries.
        </p>
      </div>

      {/* 2. THE INPUT FORM */}
      {!isLoading && !plan && (
        <form id="rescue-assessment-form" onSubmit={handleRescueSimulation} className="bg-white border border-slate-200 p-8 rounded-sm shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="proj-title"
              type="text"
              required
              label="Project or Milestone Target"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Q3 Analytics API Sync"
            />

            <Input
              id="proj-deadline"
              type="date"
              required
              label="Original Hard Deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <TextArea
            id="proj-desc"
            label="Slippage Scopes & Action Blocker Details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail current backlog status, team velocity issues, dependencies blocking progress, or key scope items that are dragging out estimates..."
          />

          <div className="pt-2">
            <Button
              id="rescue-submit-button"
              type="submit"
              fullWidth
              variant="primary"
              icon={<Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
            >
              Analyze & Generate Compressed Critical Path (Simulate Model)
            </Button>
          </div>
        </form>
      )}

      {/* 3. SIMULATED RESCUE ENGINE SCANNING TELEMETRY */}
      {isLoading && (
        <div id="rescue-loading-screen" className="bg-white border border-slate-200 p-12 rounded-sm shadow-xs text-center space-y-8">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-3 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-slate-900 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
          
          <div className="space-y-3.5 max-w-md mx-auto">
            <Badge urgency="medium">PROMPT ANALYTICS ONLINE</Badge>
            <h3 className="text-sm font-semibold text-slate-900 font-mono uppercase tracking-wider">
              Evaluating Scope Variable Matrices
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xs text-xs font-mono text-slate-500 min-h-12 flex items-center justify-center">
              "{loadingMessages[loadingStep]}"
            </div>
          </div>

          {/* Clean minimal progress bar */}
          <div className="max-w-xs mx-auto space-y-2">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-500 ease-out"
                style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>INITIALIZE</span>
              <span>COMPRESSION RATIO CALCULATED</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. HIGH-FIDELITY OUTPUT WORKBOOK */}
      {!isLoading && plan && assessment && (
        <div id="rescue-workbook-display" className="space-y-8 animate-fade-in">
          
          {/* Risk Classification Banner */}
          <div className={`p-6 border rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
            assessment.riskClassification === "CRITICAL" || assessment.riskClassification === "HIGH"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-sm flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm tracking-tight">
                    Risk Assessment: {assessment.riskClassification}
                  </h3>
                  <Badge urgency={assessment.riskClassification === "CRITICAL" ? "critical" : "high"}>
                    SCORE: {(assessment.overallRiskScore * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  <strong>Prahari Directive:</strong> {assessment.recommendedImmediateAction}
                </p>
              </div>
            </div>

            <Button
              onClick={resetRescue}
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-white border-slate-300"
            >
              Re-Assess Target
            </Button>
          </div>

          {/* Metric breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card className="space-y-4 border border-slate-200 p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Scale className="w-4.5 h-4.5 text-slate-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">Compression Metrics</h3>
              </div>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Proposed hours reduction:</span>
                  <span className="font-bold text-amber-600">-{plan.scopeCompressionRatio}% backlog scope</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Backlog efficiency score:</span>
                  <span className="font-bold text-emerald-600">OPTIMIZED EXTREMELY</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Core mitigation model:</span>
                  <span className="text-slate-700 text-right font-sans truncate max-w-[220px]" title={plan.riskMitigationStrategy}>
                    {plan.riskMitigationStrategy}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="space-y-4 border border-slate-200 p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="w-4.5 h-4.5 text-slate-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">Key Risk Vectors Detected</h3>
              </div>
              
              <ul className="space-y-2.5 text-xs text-slate-600 list-none">
                {assessment.riskFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* High contrast step-by-step Critical Path Output */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-xs">
            <div className="p-6 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Gemini Recommended Critical Execution Path</span>
                </h3>
                <p className="text-xs text-slate-500">Minimum Viable Tasks (MVT) calculated to meet raw deadline goals securely.</p>
              </div>
              <Badge urgency="low">MVT PATH ISOLATED</Badge>
            </div>

            <div className="divide-y divide-slate-100 p-4">
              {plan.criticalPathSteps.map((step) => (
                <div key={step.sequence} className="p-4 flex items-start gap-4 hover:bg-slate-50/40 transition-all rounded-xs">
                  <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-xs">
                    {step.sequence}
                  </div>
                  <div className="flex-1 space-y-1 text-left">
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-2">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-slate-300" />
                        EST: {step.estimatedHours} HOURS
                      </span>
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-300" />
                        CRITICALITY: {step.urgencyWeight}/10
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
export default RescuePage;
