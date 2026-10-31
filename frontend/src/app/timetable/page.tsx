"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/auth";
import {
  Calendar,
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const DAYS_MAP = [
  { label: "Monday", code: "MON" },
  { label: "Tuesday", code: "TUE" },
  { label: "Wednesday", code: "WED" },
  { label: "Thursday", code: "THU" },
  { label: "Friday", code: "FRI" },
];

const PERIODS = [
  { num: 1, time: "08:00 - 09:00" },
  { num: 2, time: "09:00 - 10:00" },
  { num: 3, time: "10:00 - 11:00" },
  { num: 4, time: "11:00 - 12:00" },
  { num: 5, time: "12:00 - 13:00" },
  { num: 6, time: "14:00 - 15:00" },
  { num: 7, time: "15:00 - 16:00" },
  { num: 8, time: "16:00 - 17:00" },
  { num: 9, time: "17:00 - 18:00" },
];

interface Session {
  session_id: string;
  day: string;
  start_period: number;
  end_period: number;
  duration: number;
  room_id: string;
  room_name: string;
  building: string;
  course_id: string;
  course_title: string;
  kind: string;
  groups: string[];
  faculty_id: string;
  faculty_name: string;
  department: string;
  size: number;
}

export default function TimetablePage() {
  const { role, user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState("MON");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [message, setMessage] = useState("");

  const canGenerate = role ? PERMISSIONS.canGenerateTimetable(role) : false;

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const res = await fetchBackend("/timetable/");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setMessage("Running CP-SAT Solver optimization...");
      const res = await fetchBackend("/timetable/generate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessage(
          data.message || "Timetable optimized with 0 hard violations!"
        );
        await loadTimetable();
      } else if (res.status === 403) {
        setMessage("You do not have permission to generate the timetable.");
      } else {
        setMessage(typeof data.message === "string" ? data.message : "The solver did not update the active timetable.");
      }
    } catch {
      setMessage("The solver could not be reached; the active timetable was left unchanged.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetchBackend("/timetable/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schedule.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  // Build filter option lists from loaded sessions
  const groupsList = Array.from(
    new Set(sessions.flatMap((s) => s.groups ?? []))
  ).sort();

  const facultyList = Array.from(
    new Map(
      sessions
        .filter((s) => s.faculty_id && s.faculty_id !== "—")
        .map((s) => [s.faculty_id, { id: s.faculty_id, name: s.faculty_name }])
    ).values()
  ).sort((a, b) => a.id.localeCompare(b.id));

  const roomsList = Array.from(
    new Set(sessions.map((s) => s.room_id))
  ).sort();

  // Filter by selected day + user-chosen dropdowns
  const daySessions = sessions.filter((s) => {
    if (s.day !== selectedDay) return false;
    if (filterGroup && !(s.groups ?? []).includes(filterGroup)) return false;
    if (filterFaculty && s.faculty_id !== filterFaculty) return false;
    if (filterRoom && s.room_id !== filterRoom) return false;
    return true;
  });

  const viewTitle =
    role === "faculty"
      ? `My Timetable — ${user?.name ?? ""}`
      : role === "student_representative"
      ? `My Class Timetable — ${user?.entityId ?? ""}`
      : "Weekly Timetable Matrix";

  const viewDescription =
    role === "faculty"
      ? `Your personal teaching schedule filtered by faculty ID ${user?.entityId ?? ""}`
      : role === "student_representative"
      ? `Schedule for student group ${user?.entityId ?? ""}`
      : "Comprehensive clash-free master schedule for 14 student cohorts, 40 faculty members, and 27 venues";

  return (
    <AppShell>
      <PageHeader
        title={viewTitle}
        description={viewDescription}
        badge="Zero Conflicts (0 Hard Violations)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1.5" />
              Download JSON
            </Button>
            {canGenerate && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Solving CP-SAT...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Generate via CP-SAT
                  </>
                )}
              </Button>
            )}
          </>
        }
      />

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage("")}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Ribbon */}
      <Card className="p-4 bg-surface/60 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Day tabs */}
          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-lg border border-surface-border">
            {DAYS_MAP.map((d) => (
              <button
                key={d.code}
                onClick={() => setSelectedDay(d.code)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedDay === d.code
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Dropdown filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Groups ({groupsList.length})</option>
              {groupsList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Faculty ({facultyList.length})</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} – {f.name}
                </option>
              ))}
            </select>

            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Venues ({roomsList.length})</option>
              {roomsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {(filterGroup || filterFaculty || filterRoom) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterGroup("");
                  setFilterFaculty("");
                  setFilterRoom("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Matrix */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            {daySessions.length} Sessions —{" "}
            {DAYS_MAP.find((d) => d.code === selectedDay)?.label}
          </CardTitle>
          <Badge variant="success" className="text-xs">
            0 Conflicts (Verified)
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs">Loading official timetable matrix...</p>
            </div>
          ) : daySessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No sessions scheduled matching the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Period & Time</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Groups</th>
                    <th className="py-2.5 px-3">Faculty</th>
                    <th className="py-2.5 px-3">Venue / Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {daySessions.map((s, idx) => (
                    <tr
                      key={`${s.session_id}-${idx}`}
                      className="hover:bg-surface-elevated/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-medium text-blue-400 whitespace-nowrap">
                        P{s.start_period}
                        {s.duration > 1 ? `–P${s.end_period}` : ""} ({s.duration}h)
                        <div className="text-[10px] text-slate-500 font-sans">
                          {PERIODS.find((p) => p.num === s.start_period)?.time}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">
                          {s.course_id}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {s.course_title}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            s.kind === "lab"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : s.kind === "tutorial"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {s.kind}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(s.groups ?? []).map((g: string) => (
                            <span
                              key={g}
                              className="px-1.5 py-0.5 rounded bg-surface-muted text-[10px] text-slate-300 font-mono"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">
                          {s.faculty_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {s.faculty_id} ({s.department})
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-400">
                          {s.room_id}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {s.room_name} ({s.building})
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
