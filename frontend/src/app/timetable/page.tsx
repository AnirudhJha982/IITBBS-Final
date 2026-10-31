"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";
import {
  Calendar,
  Loader2,
  Table as TableIcon,
  LayoutGrid,
  Download,
} from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

const DAYS_MAP = [
  { label: "Monday", code: "MON" },
  { label: "Tuesday", code: "TUE" },
  { label: "Wednesday", code: "WED" },
  { label: "Thursday", code: "THU" },
  { label: "Friday", code: "FRI" },
];

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "08:00", end: "09:00" },
  2: { start: "09:00", end: "10:00" },
  3: { start: "10:00", end: "11:00" },
  4: { start: "11:00", end: "12:00" },
  5: { start: "12:00", end: "13:00" },
  6: { start: "14:00", end: "15:00" },
  7: { start: "15:00", end: "16:00" },
  8: { start: "16:00", end: "17:00" },
  9: { start: "17:00", end: "18:00" },
};

function formatPeriodSlot(start: number, end: number) {
  const s = PERIOD_TIMES[start]?.start || "08:00";
  const e = PERIOD_TIMES[end]?.end || "09:00";
  return `${s} – ${e}`;
}

const GRID_ROW_HEIGHT = 92;
const LUNCH_ROW_HEIGHT = 30;
const TIMELINE_HEIGHT = GRID_ROW_HEIGHT * 9 + LUNCH_ROW_HEIGHT;

const SESSION_COLORS = [
  { card: "border-[#a4d952] bg-[#c5f26c] text-[#344a1d]", label: "bg-white/60 text-[#48622b]" },
  { card: "border-[#e9cf45] bg-[#fff06b] text-[#514713]", label: "bg-white/60 text-[#776719]" },
  { card: "border-[#e38385] bg-[#f59d9e] text-[#5d3034]", label: "bg-white/60 text-[#82464a]" },
  { card: "border-[#c29be2] bg-[#d8b4f4] text-[#493260]", label: "bg-white/60 text-[#684a91]" },
  { card: "border-[#5ec4d1] bg-[#80dfe9] text-[#174c53]", label: "bg-white/60 text-[#23637a]" },
  { card: "border-[#74aadd] bg-[#96c6ef] text-[#23455f]", label: "bg-white/60 text-[#315f86]" },
];

function colorsForCourse(courseId: string) {
  const hash = Array.from(courseId).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
  return SESSION_COLORS[hash % SESSION_COLORS.length];
}

function periodTop(period: number) {
  if (period <= 5) return (period - 1) * GRID_ROW_HEIGHT;
  return 5 * GRID_ROW_HEIGHT + LUNCH_ROW_HEIGHT + (period - 6) * GRID_ROW_HEIGHT;
}

function layoutDaySessions(items: Session[]) {
  const sorted = [...items].sort(
    (a, b) => a.start_period - b.start_period || a.end_period - b.end_period || a.session_id.localeCompare(b.session_id)
  );
  const laidOut: Array<{ session: Session; lane: number; laneCount: number }> = [];
  let cluster: Session[] = [];
  let clusterEnd = 0;

  const placeCluster = () => {
    if (!cluster.length) return;
    const laneEnds: number[] = [];
    const assigned: Array<{ session: Session; lane: number }> = [];
    for (const session of cluster) {
      let lane = laneEnds.findIndex((end) => end < session.start_period);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = session.end_period;
      assigned.push({ session, lane });
    }
    for (const assignment of assigned) {
      laidOut.push({ ...assignment, laneCount: laneEnds.length });
    }
    cluster = [];
    clusterEnd = 0;
  };

  for (const session of sorted) {
    if (cluster.length && session.start_period > clusterEnd) placeCluster();
    cluster.push(session);
    clusterEnd = Math.max(clusterEnd, session.end_period);
  }
  placeCluster();
  return laidOut;
}

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters
  const [dayFilter, setDayFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

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

  // Build filter option lists
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

  // Filtered sessions
  const filtered = sessions
    .filter((s) => {
      if (dayFilter && s.day !== dayFilter) return false;
      if (typeFilter && s.kind !== typeFilter) return false;
      if (groupFilter && !(s.groups || []).includes(groupFilter)) return false;
      if (facultyFilter && s.faculty_id !== facultyFilter) return false;
      if (roomFilter && s.room_id !== roomFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      if (a.start_period !== b.start_period) return a.start_period - b.start_period;
      return a.session_id.localeCompare(b.session_id);
    });

  const hasActiveFilters = Boolean(
    dayFilter || typeFilter || groupFilter || facultyFilter || roomFilter
  );

  const clearFilters = () => {
    setDayFilter("");
    setTypeFilter("");
    setGroupFilter("");
    setFacultyFilter("");
    setRoomFilter("");
  };

  const sessionsByDay = DAYS_MAP.map((day) => ({
    ...day,
    sessions: filtered.filter((session) => session.day === day.code),
  }));

  return (
    <AppShell>
      <Card className="overflow-hidden border-[#e3e8ef] bg-white shadow-[0_14px_40px_rgba(22,28,24,0.08)]">
        <CardHeader className="flex flex-col gap-4 border-b border-[#e8edf3] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#18243a]">
              <Calendar className="h-5 w-5 text-blue-600" />
              Scheduled Weekly Timetable ({filtered.length} matching)
            </CardTitle>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-[#dce4ee] bg-[#f8fafc] p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-[#5b6a80] hover:text-[#18243a]"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-[#5b6a80] hover:text-[#18243a]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
            </div>
          </div>

          {/* Filter Dropdowns styled like Examinations page */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Day Filter */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="h-11 min-w-[150px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-3.5 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Days (Mon-Fri)</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Session Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 min-w-[140px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-3.5 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Types</option>
              <option value="lecture">Lectures</option>
              <option value="lab">Labs</option>
              <option value="tutorial">Tutorials</option>
            </select>

            {/* Student Group Filter */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-11 min-w-[145px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-3.5 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Groups ({groupsList.length})</option>
              {groupsList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Faculty Filter */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="h-11 max-w-[210px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-3.5 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Faculty ({facultyList.length})</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} – {f.name}
                </option>
              ))}
            </select>

            {/* Room / Venue Filter */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="h-11 min-w-[140px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-3.5 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Venues ({roomsList.length})</option>
              {roomsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-lg border border-[#dce4ee] bg-white px-3.5 text-xs font-semibold text-[#5b6a80] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#18243a]"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              title="Download Schedule JSON"
              className="flex h-11 items-center gap-1.5 rounded-lg border border-[#dce4ee] bg-white px-3.5 text-xs font-semibold text-[#5b6a80] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#18243a]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[#65748a]">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm">Loading academic timetable…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#65748a]">
              No sessions found matching selected filters.
            </div>
          ) : viewMode === "table" ? (
            /* 1. TABLE VIEW: Formatted exactly like the examination table */
            <div className="overflow-x-auto px-5 pb-3">
              <table className="w-full min-w-[1240px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e5ebf2] bg-[#fbfcfe] text-[12px] font-semibold uppercase tracking-wide text-[#5b6a80]">
                    <th className="w-[120px] px-4 py-4">Session ID</th>
                    <th className="w-[190px] px-4 py-4">Slot (Day &amp; Period)</th>
                    <th className="w-[220px] px-4 py-4">Associated Course</th>
                    <th className="w-[110px] px-4 py-4">Session Type</th>
                    <th className="w-[160px] px-4 py-4">Student Groups</th>
                    <th className="w-[210px] px-4 py-4">Faculty in Charge</th>
                    <th className="w-[170px] px-4 py-4">Allocated Venue</th>
                    <th className="w-[150px] px-4 py-4">Class Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3] text-sm text-[#344157]">
                  {filtered.map((s) => (
                    <tr
                      key={s.session_id}
                      className="transition-colors odd:bg-white even:bg-[#f8fafd] hover:bg-blue-50/70"
                    >
                      {/* Session ID */}
                      <td className="px-4 py-4 font-mono font-bold text-blue-700">
                        {s.session_id}
                      </td>

                      {/* Slot (Day & Period) */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="font-semibold text-[#1f2b3f]">{s.day}</span>{" "}
                        <span
                          className={`ml-1 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            s.duration > 1
                              ? "border-[#fed7aa] bg-[#fff7ed] text-[#b45309]"
                              : "border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]"
                          }`}
                        >
                          P{s.start_period}
                          {s.duration > 1 ? `–P${s.end_period}` : ""} ({s.duration}h)
                        </span>
                        <div className="mt-0.5 font-mono text-[11px] text-[#65748a]">
                          {formatPeriodSlot(s.start_period, s.end_period)}
                        </div>
                      </td>

                      {/* Associated Course */}
                      <td className="px-4 py-4">
                        <div className="font-mono font-bold text-[#1f2b3f]">{s.course_id}</div>
                        <div className="text-xs text-[#526077] line-clamp-1">{s.course_title}</div>
                      </td>

                      {/* Session Type */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${
                            s.kind === "lab"
                              ? "border-[#e9d5ff] bg-[#faf5ff] text-[#7e22ce]"
                              : s.kind === "tutorial"
                              ? "border-[#a5f3fc] bg-[#ecfeff] text-[#0e7490]"
                              : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                          }`}
                        >
                          {s.kind}
                        </span>
                      </td>

                      {/* Student Groups */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(s.groups || []).map((g: string) => (
                            <span
                              key={g}
                              className="rounded-md bg-[#f4f6f9] px-2 py-1 font-mono text-[11px] text-[#43536b]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Faculty in Charge */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#27364d]">{s.faculty_name}</div>
                        <div className="font-mono text-xs text-[#65748a]">
                          {s.faculty_id} ({s.department})
                        </div>
                      </td>

                      {/* Allocated Venue */}
                      <td className="px-4 py-4">
                        <div className="font-mono font-bold text-[#07805d]">{s.room_id}</div>
                        <div className="text-xs text-[#65748a]">
                          {s.room_name} ({s.building})
                        </div>
                      </td>

                      {/* Class Size */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex min-h-[40px] items-center rounded-full border border-[#a9e7d6] bg-[#e7f8f2] px-3.5 py-1 text-[13px] font-medium leading-5 text-[#087f5b]">
                          {s.size} students (OK)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* 2. GRID VIEW: Weekly visual matrix fallback */
            <div className="overflow-x-auto px-5 pb-5 pt-3">
              <div className="min-w-[1080px]">
                <div
                  className="mb-2 grid gap-2"
                  style={{ gridTemplateColumns: "78px repeat(5, minmax(188px, 1fr))" }}
                >
                  <div className="flex items-end px-2 pb-3 text-[10px] font-semibold uppercase tracking-wide text-[#8b8a81]">
                    Time
                  </div>
                  {sessionsByDay.map((day) => (
                    <div key={day.code} className="rounded-xl border border-[#e8edf3] bg-[#f8fafc] px-3 py-2.5">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#18243a]">{day.label}</p>
                          <p className="text-[10px] text-[#65748a]">{day.sessions.length} sessions</p>
                        </div>
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 shadow-sm border border-[#e8edf3]">
                          {day.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="relative grid gap-2"
                  style={{
                    gridTemplateColumns: "78px repeat(5, minmax(188px, 1fr))",
                    height: `${TIMELINE_HEIGHT}px`,
                  }}
                >
                  {/* Timeline labels */}
                  <div className="relative">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((period) => (
                      <div
                        key={period}
                        className="absolute left-0 right-0 px-1 text-right text-[11px] text-[#65748a]"
                        style={{ top: `${periodTop(period)}px`, height: `${GRID_ROW_HEIGHT}px` }}
                      >
                        <div className="font-semibold text-[#18243a]">P{period}</div>
                        <div className="text-[10px]">{PERIOD_TIMES[period]?.start}</div>
                      </div>
                    ))}
                  </div>

                  {/* Columns per day */}
                  {sessionsByDay.map((day) => {
                    const laidOut = layoutDaySessions(day.sessions);
                    return (
                      <div
                        key={day.code}
                        className="relative rounded-xl border border-[#e8edf3] bg-white shadow-sm"
                      >
                        {laidOut.map(({ session, lane, laneCount }) => {
                          const top = periodTop(session.start_period);
                          const bottom =
                            periodTop(session.end_period) +
                            (session.end_period <= 5 ? GRID_ROW_HEIGHT : GRID_ROW_HEIGHT);
                          const height = Math.max(bottom - top, 56);
                          const widthPercent = 100 / Math.max(laneCount, 1);
                          const leftPercent = lane * widthPercent;
                          const palette = colorsForCourse(session.course_id);

                          return (
                            <div
                              key={session.session_id}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `calc(${leftPercent}% + 2px)`,
                                width: `calc(${widthPercent}% - 4px)`,
                              }}
                              className={`absolute z-10 flex flex-col justify-between overflow-hidden rounded-lg border p-1.5 shadow-sm transition-transform hover:z-20 hover:scale-[1.02] ${palette.card}`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono text-[10px] font-bold truncate">
                                    {session.course_id}
                                  </span>
                                  <span className={`rounded px-1 text-[9px] font-semibold uppercase ${palette.label}`}>
                                    {session.kind}
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium leading-tight line-clamp-1">
                                  {session.course_title}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className="font-semibold">{session.room_id}</span>
                                <span>{(session.groups || []).join(",")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
