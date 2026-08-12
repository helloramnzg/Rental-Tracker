import {
  SquaresFourIcon,
  ReceiptIcon,
  FileTextIcon,
  WalletIcon,
  UsersIcon,
  GearIcon,
  type Icon,
} from "@phosphor-icons/react";

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
};

// Order and labels per docs/design/22-layout-system.md Sidebar
// Navigation Items and docs/architecture/08-authentication.md
// Protected Routes. Icons are Phosphor (rounded family) — regular
// weight when inactive, fill weight when active; see NavLink.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: SquaresFourIcon },
  { label: "Monthly Billing", href: "/billing", icon: ReceiptIcon },
  { label: "Statements of Account", href: "/soa", icon: FileTextIcon },
  { label: "Payments", href: "/payments", icon: WalletIcon },
  { label: "Tenants", href: "/tenants", icon: UsersIcon },
];

export const settingsNavItem: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: GearIcon,
};
