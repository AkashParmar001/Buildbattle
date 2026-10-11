import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Sparkles,
  Tags,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feedback", label: "Feedback", icon: Inbox },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/recommendations", label: "Recommendations", icon: ListChecks },
  { href: "/issues", label: "Issues", icon: Tags },
  { href: "/pipeline", label: "Pipeline", icon: Sparkles },
];
