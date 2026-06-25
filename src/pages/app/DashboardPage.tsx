import React from "react";
import { ShieldAlert, CheckCircle2, TrendingUp, Sparkles, FileText, ArrowRight, Zap, Target, Hourglass, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { LockedRoute } from "../../config/constants";
import { Card, Badge, SectionHeader, Button } from "../../components/ui/BaseComponents";

export function DashboardPage() {
  // Mock data for Phase 2 visualization - highly aligned with the deadline rescue thesis
  const mockProjects = [
    {
      id: "proj-1",
      name: "API Gateway Re-architecture",
      deadline: "2026-07-02 (In 7 Days)",
      originalMilestones: 8,
      riskScore: 0.82,
      riskLevel: "high" as const,
      status: "Slipping Pathway",
      recs: "Bypass full trace telemetry"
    },
    {
      id: "proj-2",
      name: "User Onboarding Revamp",
      deadline: "2026-07-15 (In 20 Days)",
      originalMilestones: 5,
      riskScore: 0.35,
      riskLevel: "medium" as const,
      status: "Stable Path",
      recs: "Maintain default sprint parameters"
    },
    {
      id: "proj-3",
      name: "GDPR Compliance Verification",
      deadline: "2026-06-28 (In 3 Days)",
      originalMilestones: 12,
      riskScore: 0.94,
      riskLevel: "critical" as const,
      status: "Rescue Playbook Deployed",
      recs: "Exclude secondary visual logs"
    },
  ];

  return (
    <div id="dashboard-page-root" className="space-y-8 font-sans animate-fade-in text-left">
      
      {/* 1. DYNAMIC SYSTEM ALERT FOR RESCUE PROTOCOL */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 font-mono tracking-wider">CRITICAL INCIDENT PROTOCOL TRIGGERED</h4>
            <p className="text-xs text-amber-800">
              The project <strong>GDPR Compliance Verification</strong> has slipped past the 90% risk tolerance threshold. A custom Prahari rescue plan is currently active.
            </p>
          </div>
        </div>
        <Link to={LockedRoute.RESCUE}>
          <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700 font-mono text-[11px] shrink-0">
            VIEW CRITICAL PATH
          </Button>
        </Link>
      </div>

      {/* 2. CORE WORKSPACE METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card hoverEffect className="flex flex-col justify-between border border-slate-200">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Monitored Milestones</span>
            <h3 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">25</h3>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Across 3 target repositories</span>
            <Target className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </Card>

        <Card hoverEffect className="flex flex-col justify-between border border-slate-200">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Rescue Plans Deployed</span>
            <h3 className="text-2xl font-bold font-mono text-amber-600 tracking-tight">1</h3>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-amber-700 font-mono">
            <span>1 critical scope reduction</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
        </Card>

        <Card hoverEffect className="flex flex-col justify-between border border-slate-200">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Milestone Recovery Rate</span>
            <h3 className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">100%</h3>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-emerald-700 font-mono">
            <span>0 missed deadlines to date</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </Card>

        <Card hoverEffect className="flex flex-col justify-between border border-slate-200">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Backlog Compression Rate</span>
            <h3 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">32%</h3>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Scope hours compressed</span>
            <Zap className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* 3. WORKSPACE CORE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main List: Monitored Deadlines */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-sm shadow-xs flex flex-col">
          <div className="p-6 border-b border-slate-150 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Workspace Targets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time risk index scores computed on commits and blockers.</p>
            </div>
            <Link to={LockedRoute.RESCUE}>
              <Button size="sm" variant="outline" className="font-mono text-[11px]">
                ASSESS WORKSPACE +
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {mockProjects.map((project) => (
              <div key={project.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-all duration-200">
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-bold text-slate-900 leading-none">{project.name}</h4>
                    <Badge urgency={project.riskLevel}>{project.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Hourglass className="w-3.5 h-3.5 text-slate-400" />
                      {project.deadline}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>{project.originalMilestones} MILESTONES</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    PROPOSED REC: {project.recs}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold">Calculated Risk</p>
                    <p className={`text-base font-bold font-mono ${
                      project.riskLevel === "critical" ? "text-rose-600" :
                      project.riskLevel === "high" ? "text-amber-600" : "text-emerald-700"
                    }`}>
                      {(project.riskScore * 100).toFixed(0)}%
                    </p>
                  </div>
                  <Link to={LockedRoute.RESCUE} className="focus:outline-hidden">
                    <button className="p-2 border border-slate-200 hover:border-slate-300 rounded-sm bg-white hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-950 cursor-pointer shadow-2xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Panel: Diagnostic Activity Logs */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-sm shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Workspace Telemetry</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Simulated security check actions in Phase 2.</p>
            </div>

            <div className="space-y-5 text-xs text-slate-600">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <div>
                  <p className="font-semibold text-slate-900">Urgent Milestone Escaped</p>
                  <p className="text-slate-500 mt-0.5">GDPR database verification milestone has breached estimated safety capacity.</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1.5">2 hours ago</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <div>
                  <p className="font-semibold text-slate-900">AI Recalculation Commenced</p>
                  <p className="text-slate-500 mt-0.5">Scope compressed by 32% to bypass low-priority compliance logs.</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1.5">1 day ago</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <div>
                  <p className="font-semibold text-slate-900">Workspace Design Synchronized</p>
                  <p className="text-slate-500 mt-0.5">Prahari premium tokens, buttons, inputs, and layouts deployed successfully.</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1.5">Today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-6 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              INTEGRITY HEALTHY
            </span>
            <FileText className="w-4 h-4 text-slate-300" />
          </div>
        </div>

      </div>
    </div>
  );
}
export default DashboardPage;
