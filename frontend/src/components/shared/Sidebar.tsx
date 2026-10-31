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
  LogIn,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface NavLinkItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavLinkItem[];
}

const navigationGroups: NavGroup[] = [
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
      { name: "Venue Bookings", href: "/venue-bookings", icon: DoorClosed, badge: "Spectra" },
      { name: "Rescheduling", href: "/rescheduling", icon: RefreshCw },
      { name: "Manual Scheduling", href: "/manual-scheduling", icon: Sliders },
      { name: "Approvals", href: "/approvals", icon: CheckSquare },
    ],
  },
  {
    group: "Campus Resources",
    items: [
      { name: "Rooms & Venues", href: "/rooms", icon: Building2 },
      { name: "Faculty Directory", href: "/faculty", icon: Users },
    ],
  },
  {
    group: "Intelligence & Insights",
    items: [
      { name: "AI Assistant", href: "/assistant", icon: Bot, badge: "Hinglish" },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    group: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Campus Login", href: "/login", icon: LogIn },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-surface-border bg-navy-900 flex flex-col">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-surface-border gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white block">CampusOS AI</span>
          <span className="text-[10px] text-slate-400 block font-medium">Chitkara University</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
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
                          isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge ? (
                      <Badge variant="cyan" className="text-[10px] py-0 px-1.5 h-4">
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

      {/* Footer / Actor Status */}
      <div className="p-4 border-t border-surface-border bg-surface-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
              CU
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200 leading-none">Coordinator Portal</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-1">Chitkara Inst. Tech</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" title="System Online" />
        </div>
      </div>
    </aside>
  );
}
