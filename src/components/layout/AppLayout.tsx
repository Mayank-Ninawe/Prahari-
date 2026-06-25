import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Shield, LogOut, ChevronRight, User, AlertCircle, Database, Check, Menu, X } from "lucide-react";
import { LockedRoute } from "../../config/constants";
import { useAuth } from "../ui/ProtectedRoute";
import { APP_NAVIGATION } from "../../config/navigation";
import { Badge } from "../ui/BaseComponents";

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate(LockedRoute.LANDING);
  };

  // Close mobile navigation menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Find the currently active navigation item to display the page title dynamically
  const activeNav = APP_NAVIGATION.find((item) => item.path === location.pathname);
  const pageTitle = activeNav ? activeNav.name : "Workspace App";

  const renderNavLinks = () => (
    <>
      <span className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 px-3 mb-2.5 uppercase select-none">
        Workspace Shells
      </span>
      {APP_NAVIGATION.map((item) => {
        const isActive = location.pathname === item.path;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.path}
            id={`sidebar-item-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
            to={item.path}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xs text-xs font-medium transition-all group relative ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IconComponent
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </div>
            {isActive && (
              <span className="w-1 h-3.5 bg-amber-500 rounded-full absolute right-0 top-1/2 -translate-y-1/2"></span>
            )}
          </Link>
        );
      })}
    </>
  );

  const renderSidebarFooter = () => (
    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-3 px-2 py-2 mb-3.5 bg-white border border-slate-150 rounded-xs">
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
          {user?.name?.[0]?.toUpperCase() || "D"}
        </div>
        <div className="truncate text-left">
          <p className="text-xs font-bold text-slate-900 truncate leading-tight">
            {user?.name || "Demo Workspace User"}
          </p>
          <p className="text-[10px] text-slate-400 font-mono truncate leading-none mt-1">
            {user?.email || "demo@prahari.ai"}
          </p>
        </div>
      </div>

      <button
        id="sidebar-logout-button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:border-slate-300 hover:bg-white text-xs font-medium rounded-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5 shrink-0" />
        <span>Exit Workspace</span>
      </button>
    </div>
  );

  return (
    <div id="app-layout-root" className="min-h-screen flex bg-slate-50 text-slate-900 font-sans animate-fade-in relative">
      
      {/* =========================================================================
          1. DESKTOP SIDEBAR NAVIGATION
          ========================================================================= */}
      <aside id="app-sidebar" className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 sticky top-0 h-screen">
        
        {/* Sidebar Header Logo */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <Link to={LockedRoute.LANDING} className="flex items-center gap-2.5 focus:outline-hidden group">
            <div className="w-8 h-8 bg-slate-900 rounded-sm flex items-center justify-center group-hover:bg-slate-800 transition-colors">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-slate-900">Prahari AI</span>
              <span className="text-[8px] text-slate-400 font-mono tracking-wider leading-none">RESCUE WRAPPER</span>
            </div>
          </Link>
          <Badge urgency="low">APP</Badge>
        </div>

        {/* Dynamic Navigation Links */}
        <nav id="app-sidebar-nav" className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {renderNavLinks()}
        </nav>

        {/* User Identity Segment & Logout Button */}
        {renderSidebarFooter()}
      </aside>

      {/* =========================================================================
          2. MOBILE SLIDEOUT DRAWER NAVIGATION
          ========================================================================= */}
      {mobileMenuOpen && (
        <div 
          id="app-mobile-nav-backdrop"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        id="app-mobile-sidebar" 
        className={`fixed inset-y-0 left-0 w-72 bg-white shadow-xl border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <Link to={LockedRoute.LANDING} className="flex items-center gap-2.5 focus:outline-hidden group">
            <div className="w-8 h-8 bg-slate-900 rounded-sm flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-slate-900">Prahari AI</span>
              <span className="text-[8px] text-slate-400 font-mono tracking-wider leading-none">RESCUE WRAPPER</span>
            </div>
          </Link>
          <button 
            id="mobile-close-sidebar-btn"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav id="app-mobile-sidebar-nav" className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {renderNavLinks()}
        </nav>

        {renderSidebarFooter()}
      </aside>

      {/* =========================================================================
          3. MAIN APP CONTENT CONTAINER
          ========================================================================= */}
      <div id="app-content-wrapper" className="flex-1 flex flex-col min-w-0">
        
        {/* Main Header / Topbar */}
        <header id="app-topbar" className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
          
          {/* Mobile hamburger menu & Page Title */}
          <div className="flex items-center gap-3">
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-slate-900 md:hidden cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-wider whitespace-nowrap">PRAHARI CORE</span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <h1 className="text-[10px] sm:text-xs font-bold text-slate-900 uppercase font-mono tracking-wider truncate max-w-[120px] sm:max-w-none">{pageTitle}</h1>
            </div>
          </div>

          {/* Quick Info Alerts & Integration badges */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-sm text-[10px] font-mono text-emerald-800 font-semibold select-none">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>SYNC: FIRESTORE ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-sm text-[10px] font-mono text-amber-500 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="hidden xs:inline">CORE SHELL V4</span>
              <span className="xs:hidden">V4</span>
            </div>
          </div>
        </header>

        {/* Outer Page Container with fluid grid control */}
        <main id="app-page-container" className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default AppLayout;
