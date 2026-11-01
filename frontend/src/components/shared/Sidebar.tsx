"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  DoorClosed,
  RefreshCw,
  Bot,
  Sliders,
  Building2,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS, ROLE_LABELS, ROLE_INITIALS, type UserRole } from "@/lib/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  /** If provided, item is only shown when this returns true */
  show?: (role: UserRole) => boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const ALL_GROUPS: NavGroup[] = [
  {
    group: "Overview & Schedule",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Timetable Matrix", href: "/timetable", icon: Calendar },
      { name: "Examinations", href: "/examinations", icon: GraduationCap },
    ],
  },
  {
    group: "Operations & Booking",
    items: [
      {
        name: "Venue Bookings",
        href: "/venue-bookings",
        icon: DoorClosed,
        badge: "Spectra",
      },
      {
        name: "Rescheduling",
        href: "/rescheduling",
        icon: RefreshCw,
        show: PERMISSIONS.canReschedule,
      },
      {
        name: "Manual Scheduling",
        href: "/manual-scheduling",
        icon: Sliders,
        show: PERMISSIONS.canManualSchedule,
      },
      {
        name: "Approvals",
        href: "/approvals",
        icon: CheckSquare,
        show: PERMISSIONS.canViewApprovals,
      },
    ],
  },
  {
    group: "Campus Resources",
    items: [
      { name: "Rooms & Venues", href: "/rooms", icon: Building2 },
      {
        name: "Faculty Directory",
        href: "/faculty",
        icon: Users,
        show: PERMISSIONS.canViewFaculty,
      },
    ],
  },
  {
    group: "Intelligence & Insights",
    items: [
      {
        name: "AI Assistant",
        href: "/assistant",
        icon: Bot,
        badge: "Hinglish",
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        show: PERMISSIONS.canViewAnalytics,
      },
    ],
  },
  {
    group: "System",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        show: PERMISSIONS.canManageSettings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout, isLoading } = useAuth();

  const visibleGroups = ALL_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.show || !role || item.show(role)
    ),
  })).filter((group) => group.items.length > 0);

  const initials = role ? ROLE_INITIALS[role] : "??";
  const roleLabel = role ? ROLE_LABELS[role] : "Guest";
  const displayName = user?.name ?? "Campus User";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-surface-border bg-navy-900 flex flex-col">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-surface-border gap-3">
        <img
          src="/vetogrid-eagle.svg"
          alt="VetoGrid logo"
          className="h-9 w-9 rounded-lg object-contain bg-[#f7f6f2]"
        />
        <div>
          <span className="font-bold text-sm tracking-tight text-slate-900 block">
            VetoGrid
          </span>
          <span className="text-[10px] text-slate-400 block font-medium">
            Chitkara Institute of Technology
          </span>
        </div>
      </div>

      {/* Role Badge */}
      {!isLoading && role && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[11px] font-medium text-blue-300 truncate">
            {roleLabel}
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/70"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive
                            ? "text-blue-400"
                            : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge ? (
                      <Badge
                        variant="cyan"
                        className="text-[10px] py-0 px-1.5 h-4"
                      >
                        {item.badge}
                      </Badge>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: User info + Logout */}
      <div className="p-4 border-t border-surface-border bg-surface-muted/30 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] shrink-0">
            <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-[11px] font-bold text-blue-300">
              {initials}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-100 truncate leading-none">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
