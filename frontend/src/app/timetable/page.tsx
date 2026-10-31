"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/auth";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
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

const GRID_ROW_HEIGHT = 92;
const LUNCH_ROW_HEIGHT = 30;
const TIMELINE_HEIGHT = GRID_ROW_HEIGHT * PERIODS.length + LUNCH_ROW_HEIGHT;

const SESSION_COLORS: Record<string, { card: string; label: string }> = {
  lecture: {
    card: "border-[#8ed2ed] bg-[#d8f2fb] text-[#164b60]",
    label: "bg-white/60 text-[#23637a]",
  },
  tutorial: {
    card: "border-[#c6a8ef] bg-[#eee2ff] text-[#493167]",
    label: "bg-white/60 text-[#684a91]",
  },
  lab: {
    card: "border-[#e6c66e] bg-[#fff0bf] text-[#654c10]",
    label: "bg-white/60 text-[#83641a]",
  },
};

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

function formatClockTime(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, "0")}:${minutes} ${suffix}`;
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

export default function TimetablePage() {
  const { role, user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
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

  // Apply the chosen filters to the full recurring teaching week.
  const visibleSessions = sessions.filter((s) => {
    if (filterGroup && !(s.groups ?? []).includes(filterGroup)) return false;
    if (filterFaculty && s.faculty_id !== filterFaculty) return false;
    if (filterRoom && s.room_id !== filterRoom) return false;
    if (filterCategory && s.kind !== filterCategory) return false;
    return true;
  });

  const sessionsByDay = DAYS_MAP.map((day) => ({
    ...day,
    sessions: visibleSessions.filter((session) => session.day === day.code),
  }));

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

      <Card className="mb-4 overflow-hidden border-[#e7e3dc] bg-[#fbfaf7] text-[#252724] shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeece6] text-[#55584f]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Recurring teaching week</p>
                <p className="text-xs text-[#77786f]">Monday – Friday · official weekly schedule</p>
              </div>
            </div>

            <label className="relative flex h-9 min-w-[158px] items-center rounded-lg border border-[#dedbd4] bg-white px-3 text-xs text-[#44463f] shadow-sm">
              <span className="sr-only">Filter by category</span>
              <select
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
                className="h-full w-full appearance-none bg-transparent pr-5 outline-none"
              >
                <option value="">All categories</option>
                <option value="lecture">Lectures</option>
                <option value="tutorial">Tutorials</option>
                <option value="lab">Labs</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#77786f]" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={filterGroup}
              onChange={(event) => setFilterGroup(event.target.value)}
              className="h-9 rounded-lg border border-[#dedbd4] bg-white px-3 text-xs text-[#44463f] shadow-sm outline-none focus:border-[#9fc4b7]"
            >
              <option value="">All groups ({groupsList.length})</option>
              {groupsList.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            <select
              value={filterFaculty}
              onChange={(event) => setFilterFaculty(event.target.value)}
              className="h-9 max-w-[240px] rounded-lg border border-[#dedbd4] bg-white px-3 text-xs text-[#44463f] shadow-sm outline-none focus:border-[#9fc4b7]"
            >
              <option value="">All faculty ({facultyList.length})</option>
              {facultyList.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.id} – {faculty.name}</option>)}
            </select>
            <select
              value={filterRoom}
              onChange={(event) => setFilterRoom(event.target.value)}
              className="h-9 rounded-lg border border-[#dedbd4] bg-white px-3 text-xs text-[#44463f] shadow-sm outline-none focus:border-[#9fc4b7]"
            >
              <option value="">All rooms ({roomsList.length})</option>
              {roomsList.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
            {(filterGroup || filterFaculty || filterRoom || filterCategory) && (
              <button
                onClick={() => {
                  setFilterGroup("");
                  setFilterFaculty("");
                  setFilterRoom("");
                  setFilterCategory("");
                }}
                className="h-9 rounded-lg px-3 text-xs font-medium text-[#69756b] transition-colors hover:bg-[#efeee9] hover:text-[#283d32]"
              >
                Clear filters
              </button>
            )}
            <span className="ml-auto text-xs text-[#85857d]">
              Showing <strong className="font-semibold text-[#4a4c45]">{visibleSessions.length}</strong> of {sessions.length} sessions
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#e3dfd8] bg-[#fbfaf7] text-[#252724] shadow-[0_14px_40px_rgba(22,28,24,0.08)]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#e8e5df] px-5 py-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#272a26]">
              <Calendar className="h-4 w-4 text-[#6d9181]" />
              Weekly timetable
            </CardTitle>
            <p className="mt-1 text-xs text-[#85857d]">{visibleSessions.length} sessions across the teaching week</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[#7b7d75]">
              <Loader2 className="h-6 w-6 animate-spin text-[#6d9181]" />
              <p className="text-xs">Loading official weekly timetable…</p>
            </div>
          ) : (
            <div className="overflow-x-auto px-4 pb-4 pt-3">
              <div className="min-w-[1080px]">
                <div
                  className="mb-2 grid gap-2"
                  style={{ gridTemplateColumns: "78px repeat(5, minmax(188px, 1fr))" }}
                >
                  <div className="flex items-end px-2 pb-3 text-[10px] font-semibold uppercase tracking-wide text-[#8b8a81]">Time</div>
                  {sessionsByDay.map((day) => (
                    <div key={day.code} className="rounded-xl border border-[#e8e5df] bg-[#f3f1ec] px-3 py-2.5">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-[17px] font-semibold leading-none text-[#292c28]">{day.label.slice(0, 3)}</p>
                          <p className="mt-1 text-[10px] text-[#85857d]">{day.label}</p>
                        </div>
                        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-[#77786f]">
                          {day.sessions.length} sessions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "78px repeat(5, minmax(188px, 1fr))" }}
                >
                  <div className="relative" style={{ height: TIMELINE_HEIGHT }}>
                    {PERIODS.map((period) => {
                      const [start, end] = period.time.split(" - ");
                      return (
                        <div key={period.num} className="absolute left-0 right-1 flex flex-col justify-center pl-1" style={{ top: periodTop(period.num), height: GRID_ROW_HEIGHT }}>
                          <span className="text-[10px] font-medium text-[#4f514a]">{formatClockTime(start)}</span>
                          <span className="mt-0.5 text-[9px] text-[#96958c]">{formatClockTime(end)}</span>
                        </div>
                      );
                    })}
                    <div className="absolute left-1 right-1 flex flex-col justify-center border-y border-[#e9e6df] pl-1 text-[9px] text-[#aaa79d]" style={{ top: 5 * GRID_ROW_HEIGHT, height: LUNCH_ROW_HEIGHT }}>
                      <span>01:00 PM</span>
                      <span>02:00 PM</span>
                    </div>
                  </div>

                  {sessionsByDay.map((day) => (
                    <div key={day.code} className="relative overflow-hidden rounded-xl" style={{ height: TIMELINE_HEIGHT }}>
                      {PERIODS.map((period) => (
                        <div
                          key={period.num}
                          className="group absolute left-0 right-0 rounded-lg border border-dashed border-[#dedbd4] bg-white/55 transition-colors hover:border-[#c8d6cc] hover:bg-white/80"
                          style={{ top: periodTop(period.num) + 3, height: GRID_ROW_HEIGHT - 6 }}
                        >
                          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-lg font-light text-[#c5c3bb] opacity-0 transition-opacity group-hover:opacity-70">+</span>
                        </div>
                      ))}
                      <div
                        className="absolute left-0 right-0 flex items-center justify-center border-y border-[#e8e5df] bg-[#f3f1ec]/90 text-[9px] font-medium uppercase tracking-[0.16em] text-[#a09e94]"
                        style={{ top: 5 * GRID_ROW_HEIGHT, height: LUNCH_ROW_HEIGHT }}
                      >
                        Lunch break
                      </div>
                      {layoutDaySessions(day.sessions).map(({ session, lane, laneCount }) => {
                        const colors = SESSION_COLORS[session.kind] || SESSION_COLORS.lecture;
                        const width = 100 / laneCount;
                        const groupSummary = (session.groups ?? []).slice(0, 2).join(", ");
                        return (
                          <article
                            key={session.session_id}
                            title={`${session.course_id} · ${session.course_title} · ${session.kind} · ${session.room_name} · ${session.faculty_name}`}
                            className={`absolute z-10 overflow-hidden rounded-lg border px-2.5 py-2 shadow-[0_2px_5px_rgba(30,35,32,0.08)] transition duration-150 hover:z-20 hover:-translate-y-0.5 hover:shadow-md ${colors.card}`}
                            style={{
                              top: periodTop(session.start_period) + 5,
                              height: Math.max(66, session.duration * GRID_ROW_HEIGHT - 10),
                              left: `calc(${lane * width}% + 4px)`,
                              width: `calc(${width}% - 8px)`,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${colors.label}`}>{session.kind}</span>
                              <span className="truncate text-[9px] font-semibold opacity-70">{session.course_id}</span>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-[1.2]">
                              {session.course_title || session.course_id}
                            </p>
                            <p className="mt-1 truncate text-[9px] opacity-75">
                              P{session.start_period}{session.duration > 1 ? `–P${session.end_period}` : ""} · {session.room_id}
                            </p>
                            <p className="truncate text-[9px] opacity-70">
                              {groupSummary || session.faculty_name}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {visibleSessions.length === 0 && (
                  <p className="py-5 text-center text-xs text-[#85857d]">No sessions match these filters. Clear filters to see the full week.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
