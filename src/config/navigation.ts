import { LayoutDashboard, ShieldAlert, Settings, HelpCircle } from "lucide-react";
import { LockedRoute } from "./constants";

export interface NavigationItem {
  name: string;
  path: string;
  icon: any;
  description: string;
}

export const APP_NAVIGATION: NavigationItem[] = [
  {
    name: "Dashboard",
    path: LockedRoute.DASHBOARD,
    icon: LayoutDashboard,
    description: "See what needs attention and what to do next.",
  },
  {
    name: "Rescue Plan",
    path: LockedRoute.RESCUE,
    icon: ShieldAlert,
    description: "Review risk, get a recovery path, and act before a deadline slips.",
  },
  {
    name: "Settings",
    path: LockedRoute.PROFILE,
    icon: Settings,
    description: "Manage alerts, preferences, and your account.",
  },
];

export const HELP_NAVIGATION: NavigationItem[] = [
  {
    name: "Help",
    path: "#docs",
    icon: HelpCircle,
    description: "Learn how Prahari AI helps you stay ahead of deadlines.",
  },
];