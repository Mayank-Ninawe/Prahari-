import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PrahariLogo } from "../ui/PrahariLogo";
import { LockedRoute } from "@/config/constants";
import { useAuth } from "../ui/ProtectedRoute";
import { Button } from "../ui/BaseComponents";

export function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div id="public-layout-root" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Universal Public Navigation Header */}
      <header id="public-header" className="sticky top-0 z-50 bg-[#f9f8f5]/80 backdrop-blur-md border-b border-[#28251d]/12 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link id="logo-link" to={LockedRoute.LANDING} className="flex items-center gap-2.5 focus:outline-none group">
            <div className="w-9 h-9 bg-[#28251d] rounded-sm flex items-center justify-center shadow-sm group-hover:bg-[#01696f] transition-colors">
              <PrahariLogo className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg tracking-tight text-[#28251d] translate-y-[1px]">Prahari AI</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-widest bg-[#01696f]/10 text-[#01696f] font-mono font-bold rounded-sm">
                  Phase 2
                </span>
              </div>
              <span className="text-[10px] text-[#7a7974] font-mono font-bold tracking-widest leading-none mt-0.5">
                MILESTONE INTEGRITY LAYER
              </span>
            </div>
          </Link>

          <nav id="public-nav" className="flex items-center gap-6">
            <Link id="nav-home" to={LockedRoute.LANDING} className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7a7974] hover:text-[#28251d] transition-colors">
              Home
            </Link>
            
            {isAuthenticated ? (
              <Link id="nav-dashboard" to={LockedRoute.DASHBOARD} className="flex items-center gap-2 bg-[#01696f] hover:bg-[#005156] text-white px-5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm hover:-translate-y-0.5 hover:shadow">
                <span>Enter App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link id="nav-login" to={LockedRoute.AUTH} className="bg-[#01696f] hover:bg-[#005156] text-white px-5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm hover:-translate-y-0.5 hover:shadow">
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Primary Page Layout Outlet */}
      <main id="public-main-content" className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Universal Public Footer */}
      <footer id="public-footer" className="bg-white border-t border-slate-200 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <span>© {new Date().getFullYear()} Prahari AI. All rights reserved.</span>
            <span className="text-slate-300">|</span>
            <span>SECURE SYSTEM</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-500 font-medium">
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default PublicLayout;
