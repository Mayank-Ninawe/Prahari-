import { LayoutDashboard, ShieldAlert, Settings, HelpCircle } from "lucide-react";
import { LockedRoute } from "./constants";

export interface NavigationItem {
  name: string;
  path: string;
  icon: any; // Lucide icon reference
  description: string;
}

export const APP_NAVIGATION: NavigationItem[] = [
  {
    name: "Rescue Dashboard",
    path: LockedRoute.DASHBOARD,
    icon: LayoutDashboard,
    description: "Monitor real-time deadline risks and critical task scores.",
  },
  {
    name: "Rescue Core",
    path: LockedRoute.RESCUE,
    icon: ShieldAlert,
    description: "Assess risks, compress delivery scopes, and generate AI rescue pathways.",
  },
  {
    name: "Profile & Settings",
    path: LockedRoute.PROFILE,
    icon: Settings,
    description: "Manage notification triggers, calendar syncs, and Prahari account.",
  },
];

export const HELP_NAVIGATION: NavigationItem[] = [
  {
    name: "System Documentation",
    path: "#docs",
    icon: HelpCircle,
    description: "Learn about the Prahari AI risk assessment methodology.",
  },
];
