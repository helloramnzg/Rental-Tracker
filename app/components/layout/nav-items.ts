import {
  LayoutDashboard,
  Receipt,
  FileText,
  Wallet,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Order and labels per docs/design/22-layout-system.md Sidebar
// Navigation Items and docs/architecture/08-authentication.md
// Protected Routes.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Monthly Billing", href: "/billing", icon: Receipt },
  { label: "Statements of Account", href: "/soa", icon: FileText },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Tenants", href: "/tenants", icon: Users },
];

export const settingsNavItem: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};
