/**
 * Prahari AI - Global Constants & Shared Enums
 * Preparation for later phases
 */

export enum LockedRoute {
  LANDING = "/",
  AUTH = "/auth",
  DASHBOARD = "/app/dashboard",
  RESCUE = "/app/rescue",
  PROFILE = "/app/profile",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TaskStatus {
  COMPLETED = "COMPLETED",
  IN_PROGRESS = "IN_PROGRESS",
  RISK_DETECTED = "RISK_DETECTED",
  OVERDUE = "OVERDUE",
  PENDING = "PENDING",
}

export enum RescuePlanStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

export const APP_METADATA = {
  name: "Prahari AI",
  tagline: "AI-Powered Deadline Rescue System",
  description: "A professional, proactive shield against missed deadlines. Prahari AI monitors risk patterns, creates targeted rescue actions, compresses delivery scopes, and keeps teams on course.",
};
