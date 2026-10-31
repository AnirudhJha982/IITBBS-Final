"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, ShieldCheck, Activity, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function Header() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    // Quick probe to backend health endpoint
    const checkApi = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/health", { method: "GET" });
        if (res.ok) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch {
        setApiStatus("offline");
      }
    };
    checkApi();
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-surface-border bg-navy-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Quick search input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search timetable, rooms, courses, or ask assistant..."
            className="w-full h-9 pl-9 pr-12 rounded-lg border border-surface-border bg-surface-muted/50 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-1.5 py-0.5 rounded border border-surface-border bg-surface-elevated text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right status tools */}
      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-elevated/80 border border-surface-border text-xs">
          <Activity
            className={`w-3.5 h-3.5 ${
              apiStatus === "online"
                ? "text-emerald-400"
                : apiStatus === "checking"
                ? "text-amber-400 animate-pulse"
                : "text-slate-400"
            }`}
          />
          <span className="text-[11px] font-medium text-slate-300">
            Backend API:{" "}
            {apiStatus === "online" ? (
              <span className="text-emerald-400 font-semibold">Online (8000)</span>
            ) : apiStatus === "checking" ? (
              <span className="text-amber-400">Probing...</span>
            ) : (
              <span className="text-slate-400">Standby</span>
            )}
          </span>
        </div>

        {/* Solver Engine status */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-elevated/80 border border-surface-border text-xs">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium text-slate-300">
            CP-SAT Solver: <span className="text-cyan-400 font-semibold">Ready</span>
          </span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px]">
            <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-xs font-semibold text-blue-300">
              AC
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
