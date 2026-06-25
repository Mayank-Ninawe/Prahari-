import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { LockedRoute } from "../../config/constants";
import { useAuth } from "../ui/ProtectedRoute";
import { Button } from "../ui/BaseComponents";

export function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div id="public-layout-root" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Universal Public Navigation Header */}
      <header id="public-header" className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link id="logo-link" to={LockedRoute.LANDING} className="flex items-center gap-2.5 focus:outline-hidden group">
            <div className="w-9 h-9 bg-slate-900 rounded-sm flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-slate-900">Prahari AI</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-slate-100 text-slate-600 font-mono rounded-xs border border-slate-200">
                  Phase 2
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide leading-none">
                MILESTONE INTEGRITY LAYER
              </span>
            </div>
          </Link>

          <nav id="public-nav" className="flex items-center gap-6">
            <Link id="nav-home" to={LockedRoute.LANDING} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Home
            </Link>
            
            {isAuthenticated ? (
              <Link id="nav-dashboard" to={LockedRoute.DASHBOARD}>
                <Button size="sm" variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Enter App
                </Button>
              </Link>
            ) : (
              <Link id="nav-login" to={LockedRoute.AUTH}>
                <Button size="sm" variant="primary">
                  Login / Register
                </Button>
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
