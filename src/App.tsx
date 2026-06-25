/**
 * Prahari AI Router Setup
 * Coordinates public pages, protected layouts, and simulated authentication contexts.
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./components/ui/ProtectedRoute";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { LandingPage } from "./pages/public/LandingPage";
import { AuthPage } from "./pages/public/AuthPage";
import { DashboardPage } from "./pages/app/DashboardPage";
import { RescuePage } from "./pages/app/RescuePage";
import { ProfilePage } from "./pages/app/ProfilePage";
import { LockedRoute } from "./config/constants";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ===============================================================
              PUBLIC ACCESSIBLE ROUTES
              =============================================================== */}
          <Route element={<PublicLayout />}>
            {/* Landing/Home Page */}
            <Route path={LockedRoute.LANDING} element={<LandingPage />} />
            {/* Authenticate split page */}
            <Route path={LockedRoute.AUTH} element={<AuthPage />} />
          </Route>

          {/* ===============================================================
              PROTECTED APPLICATION SHELLS (Requires Authentication State)
              =============================================================== */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect /app directly to dashboard */}
            <Route index element={<Navigate to={LockedRoute.DASHBOARD} replace />} />
            
            {/* Dashboard Workspace Shell */}
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* AI Rescue Matrix Shell */}
            <Route path="rescue" element={<RescuePage />} />
            
            {/* Settings & User Profiles Shell */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Global Fallback Redirect to Landing */}
          <Route path="*" element={<Navigate to={LockedRoute.LANDING} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
