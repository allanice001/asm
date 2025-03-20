"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Shield,
  FileText,
  Server,
  Upload,
  Settings,
  Users,
  ClipboardList,
  BarChart,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/accounts", label: "AWS Accounts", icon: Server },
  { href: "/permission-sets", label: "Permission Sets", icon: Shield },
  { href: "/policies", label: "Policies", icon: FileText },
  { href: "/deployments", label: "Deployments", icon: Upload },
  { href: "/reports", label: "Reports", icon: BarChart },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  {
    href: "/audit-logs",
    label: "Audit Logs",
    icon: ClipboardList,
    adminOnly: true,
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center h-16 px-4 border-b">
          <h2 className="text-lg font-semibold">AWS SSO Manager</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            // Skip admin-only items for non-admin users
            if (item.adminOnly && !isAdmin) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
