"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Activity, LogOut, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { ROLE_INITIALS, ROLE_LABELS } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, role, logout } = useAuth();

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to assistant or timetable with the query
    router.push(`/assistant?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const initials = role ? ROLE_INITIALS[role] : "??";
  const roleLabel = role ? ROLE_LABELS[role] : "";

  const notifications = [
    {
      id: 1,
      title: "Master Timetable Generated",
      desc: "Google OR-Tools CP-SAT achieved OPTIMAL status with 0 hard violations.",
      time: "10m ago",
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      id: 2,
      title: "Spectra Festival Week Venue Allocations",
      desc: "25 booking requests resolved with 22 direct approvals and 2 alternative evening slots.",
      time: "1h ago",
      icon: ShieldCheck,
      color: "text-cyan-400",
    },
    {
      id: 3,
      title: "Maintenance Notice: CR-102 Closed",
      desc: "Disruption engine generated schedule_after.json with 0 conflicts.",
      time: "3h ago",
      icon: Activity,
      color: "text-amber-400",
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-surface-border bg-navy-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timetable, rooms, courses, or ask assistant..."
            className="w-full h-9 pl-9 pr-12 rounded-lg border border-surface-border bg-surface-muted/50 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-1.5 py-0.5 rounded border border-surface-border bg-surface-elevated text-[10px] text-slate-400 font-mono">
            ↵
          </kbd>
        </div>
      </form>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface border border-surface-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border mb-3">
                <span className="text-xs font-semibold text-slate-200">Campus Alerts</span>
                <span className="text-[10px] text-blue-400 font-mono">3 new</span>
              </div>
              <div className="space-y-3">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-2.5 rounded-lg bg-surface-muted/60 border border-surface-border/50 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${n.color}`} />
                        <span className="font-semibold text-slate-200">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{n.desc}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{n.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative flex items-center gap-2.5 pl-3 border-l border-surface-border" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-semibold text-slate-200 leading-none">
                {user?.name ?? "Campus User"}
              </p>
              {roleLabel && (
                <p className="text-[10px] text-slate-400 mt-0.5">{roleLabel}</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px]">
              <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-[11px] font-bold text-blue-300">
                {initials}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 rounded-xl bg-surface border border-surface-border shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
              <div className="pb-2 border-b border-surface-border">
                <p className="text-xs font-semibold text-slate-100">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                <Badge variant="cyan" className="text-[10px] mt-1.5 capitalize">
                  {roleLabel}
                </Badge>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
