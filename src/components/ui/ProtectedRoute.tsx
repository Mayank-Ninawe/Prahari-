import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LockedRoute } from "../../config/constants";

// Authentication Context
interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Phase 1 Mock Auth State: Default to true for easy preview of inner shells,
  // but persist to localStorage so the user can easily toggle login/logout in the UI.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem("prahari_auth_state");
    return saved !== null ? saved === "true" : true; // Default to true on fresh load
  });

  const [user, setUser] = useState<{ email: string; name: string } | null>(() => {
    if (isAuthenticated) {
      return { email: "demo@prahari.ai", name: "Prahari Workspace User" };
    }
    return null;
  });

  const login = async (email: string) => {
    // Simulate Phase 1 network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsAuthenticated(true);
    setUser({ email, name: email.split("@")[0] || "Prahari User" });
    localStorage.setItem("prahari_auth_state", "true");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.setItem("prahari_auth_state", "false");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}

/**
 * ProtectedRoute component that blocks unauthenticated access
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to Auth screen, preserving current location for return redirects
    return <Navigate to={LockedRoute.AUTH} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
