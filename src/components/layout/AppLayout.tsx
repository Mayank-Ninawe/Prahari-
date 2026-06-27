import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Shield, LogOut, Menu, X } from "lucide-react";
import { LockedRoute } from "@/config/constants";
import { useAuth } from "../ui/ProtectedRoute";
import { APP_NAVIGATION } from "../../config/navigation";

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate(LockedRoute.LANDING);
  };

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const activeNav = APP_NAVIGATION.find((item) => item.path === location.pathname);
  const pageTitle = activeNav ? activeNav.name : "Workspace";

  const renderNavLinks = () => (
    <div className="flex flex-col gap-1">
      {APP_NAVIGATION.map((item) => {
        const isActive = location.pathname === item.path;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.path}
            id={`sidebar-item-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
            to={item.path}
            className={`flex items-center justify-between pl-3.5 pr-3 py-2.5 rounded-sm text-sm transition-all group relative ${
              isActive
                ? "bg-[#01696f]/6 text-[#28251d] font-semibold"
                : "text-[#7a7974] hover:bg-[#28251d]/4 hover:text-[#28251d]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IconComponent
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-[#01696f]"
                    : "text-[#a19d96] group-hover:text-[#5f5b53]"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </div>

            {isActive && (
              <span className="w-0.5 h-4 bg-[#01696f] rounded-full absolute left-0 top-1/2 -translate-y-1/2"></span>
            )}
          </Link>
        );
      })}
    </div>
  );

  const renderSidebarFooter = () => (
    <div className="p-4 border-t border-[#28251d]/8 mt-auto flex flex-col gap-3 bg-transparent">
      <div className="flex items-center gap-2.5 px-1 py-1">
        <div className="w-8 h-8 rounded-full bg-[#28251d] text-[#f9f8f5] flex items-center justify-center text-xs font-semibold shrink-0">
          {user?.name?.[0]?.toUpperCase() || "D"}
        </div>

        <div className="truncate text-left min-w-0">
          <p className="text-xs font-semibold text-[#28251d] truncate leading-tight">
            {user?.name || "Demo User"}
          </p>
          <p className="text-[11px] text-[#7a7974] truncate leading-none mt-0.5">
            {user?.email || "demo@prahari.ai"}
          </p>
        </div>
      </div>

      <button
        id="sidebar-logout-button"
        onClick={handleLogout}
        className="flex items-center gap-2 px-1 py-1 text-[11px] font-medium text-[#7a7974] hover:text-[#28251d] transition-colors cursor-pointer group w-fit"
      >
        <LogOut className="w-3.5 h-3.5 shrink-0 text-[#a19d96] group-hover:text-[#5f5b53] transition-colors" />
        <span>Sign out</span>
      </button>
    </div>
  );

  return (
    <div
      id="app-layout-root"
      className="min-h-screen flex bg-[#f9f8f5] text-[#28251d] font-sans relative animate-fade-in"
    >
      {/* =========================================================================
          1. DESKTOP SIDEBAR NAVIGATION
          ========================================================================= */}
      <aside
        id="app-sidebar"
        className="w-60 bg-[#f5f2ed] border-r border-[#28251d]/8 hidden md:flex flex-col shrink-0 sticky top-0 h-screen"
      >
        <div className="h-14 px-5 border-b border-[#28251d]/8 flex items-center justify-between shrink-0">
          <Link
            to={LockedRoute.LANDING}
            className="flex items-center gap-2.5 focus:outline-none group"
          >
            <div className="w-7 h-7 bg-[#28251d] rounded-sm flex items-center justify-center group-hover:bg-[#005156] transition-colors">
              <Shield className="w-4 h-4 text-[#f9f8f5]" />
            </div>

            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-wide text-[#28251d] uppercase">
                Prahari AI
              </span>
              <span className="text-[10px] text-[#7a7974] leading-none mt-0.5">
                Rescue workspace
              </span>
            </div>
          </Link>
        </div>

        <nav
          id="app-sidebar-nav"
          className="flex-1 px-3 py-5 space-y-1 overflow-y-auto"
        >
          {renderNavLinks()}
        </nav>

        {renderSidebarFooter()}
      </aside>

      {/* =========================================================================
          2. MOBILE SLIDEOUT DRAWER NAVIGATION
          ========================================================================= */}
      {mobileMenuOpen && (
        <div
          id="app-mobile-nav-backdrop"
          className="fixed inset-0 bg-[#28251d]/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        id="app-mobile-sidebar"
        className={`fixed inset-y-0 left-0 w-64 bg-[#f5f2ed] shadow-xl border-r border-[#28251d]/8 z-50 flex flex-col transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 px-5 border-b border-[#28251d]/8 flex items-center justify-between shrink-0">
          <Link
            to={LockedRoute.LANDING}
            className="flex items-center gap-2.5 focus:outline-none group"
          >
            <div className="w-7 h-7 bg-[#28251d] rounded-sm flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#f9f8f5]" />
            </div>

            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-wide text-[#28251d] uppercase">
                Prahari AI
              </span>
              <span className="text-[10px] text-[#7a7974] leading-none mt-0.5">
                Rescue workspace
              </span>
            </div>
          </Link>

          <button
            id="mobile-close-sidebar-btn"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 hover:bg-[#28251d]/5 rounded-sm text-[#7a7974] hover:text-[#28251d] cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav
          id="app-mobile-sidebar-nav"
          className="flex-1 px-3 py-5 space-y-1 overflow-y-auto"
        >
          {renderNavLinks()}
        </nav>

        {renderSidebarFooter()}
      </aside>

      {/* =========================================================================
          3. MAIN APP CONTENT CONTAINER
          ========================================================================= */}
      <div id="app-content-wrapper" className="flex-1 flex flex-col min-w-0">
        <header
          id="app-topbar"
          className="h-14 bg-[#f9f8f5] border-b border-[#28251d]/8 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30"
        >
          <div className="flex items-center gap-3">
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 hover:bg-[#28251d]/5 rounded-sm text-[#7a7974] hover:text-[#28251d] md:hidden cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] text-[#7a7974] tracking-wide">
                Workspace
              </span>
              <span className="text-[#b8b3ab] text-xs">/</span>
              <h1 className="text-sm font-semibold text-[#28251d] truncate max-w-[180px] sm:max-w-none">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-[#7a7974]">System ready</span>
            </div>
          </div>
        </header>

        <main
          id="app-page-container"
          className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;