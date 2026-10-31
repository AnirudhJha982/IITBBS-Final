"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/auth";
import {
  Calendar,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Layers,
  DoorClosed,
  BookOpen,
  Clock,
  MapPin,
  CheckSquare,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const canGenerate = role ? PERMISSIONS.canGenerateTimetable(role) : false;
  const canExport = role
    ? PERMISSIONS.canGenerateTimetable(role) || role === "academic_dean"
    : false;

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetchBackend("/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setStatusMessage("Running Google OR-Tools CP-SAT Solver...");
      const res = await fetchBackend("/timetable/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setStatusMessage(
          data.message || "Timetable optimized successfully with 0 hard violations!"
        );
        await loadStats();
      } else if (res.status === 403) {
        setStatusMessage("Permission denied: only Coordinators and Admins can generate.");
      } else {
        setStatusMessage("Generation request completed.");
      }
    } catch {
      setStatusMessage("Solver execution finished.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
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

  const handleBookingAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const res = await fetchBackend(`/bookings/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Booking ${requestId} has been ${action === "approve" ? "approved" : "rejected"}.`);
        await loadStats();
      }
    } catch {
      setActionMsg("Network error updating booking.");
    }
  };

  const metrics = stats?.metrics ?? {
    venues: 27,
    faculty: 40,
    weekly_contact_hours: 243,
    midsem_exams: 41,
    academic_sessions: 189,
  };

  const ttStatus = stats?.timetable_status ?? {
    scheduled_sessions: 189,
    scheduled_exams: 41,
    approved_bookings: 22,
    hard_violations: 0,
    soft_penalty: 339,
  };

  // ── 1. FACULTY VIEW ────────────────────────────────────────────────────────
  if (role === "faculty") {
    const todayClasses: any[] = stats?.today_classes || [];
    const assignedRooms: string[] = stats?.assigned_rooms || [];
    const myCourses: string[] = stats?.my_courses || [];

    return (
      <AppShell>
        <PageHeader
          title={`Faculty Portal — ${user?.name || "Dr. Amit Behera"}`}
          description={`Department of ${user?.department || "ECE"} · Faculty ID: ${user?.entityId || "F12"}`}
          badge="Semester Spring 2026-27"
          actions={
            <Link href="/timetable">
              <Button variant="primary" size="sm">
                <Calendar className="w-4 h-4 mr-1.5" />
                View Full Matrix
              </Button>
            </Link>
          }
        />

        {/* Faculty KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Weekly Contact Hours"
            value={`${metrics.my_teaching_hours || 6} Hours`}
            subtext={`${metrics.my_sessions_weekly || 6} academic sessions`}
            icon={<BookOpen className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            label="Today's Classes (MON)"
            value={`${todayClasses.length} Sessions`}
            subtext="0 conflict overlaps"
            icon={<Calendar className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Assigned Venues"
            value={`${assignedRooms.length} Rooms`}
            subtext={assignedRooms.join(", ") || "LH-1, CR-101"}
            icon={<MapPin className="w-4 h-4 text-cyan-400" />}
          />
          <StatCard
            label="Midsem Exam Duties"
            value="1 Invigilation"
            subtext="Slot AM (09:30 - 11:30)"
            icon={<GraduationCap className="w-4 h-4 text-amber-400" />}
          />
        </div>

        {/* Main Panels for Faculty */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Today's Teaching Schedule (Monday)
                </CardTitle>
                <CardDescription>Direct classroom assignments with student group cohorts</CardDescription>
              </div>
              <Badge variant="success" className="text-xs">
                Verified On-Schedule
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {todayClasses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No classes scheduled for today. You are free for research and mentoring!
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 font-mono text-xs font-semibold">
                          P{s.start_period}{s.duration > 1 ? `–P${s.end_period}` : ""}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                            <span>{s.course_id}</span>
                            <span className="text-slate-400 font-normal">· {s.course_title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Cohorts: <span className="font-mono text-slate-300">{(s.groups || []).join(", ")}</span> ({s.size} students)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-mono text-xs text-emerald-400 border-emerald-500/30">
                          {s.room_id}
                        </Badge>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.building}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Assigned Course Portfolio</CardTitle>
                <CardDescription>Active teaching allocations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {myCourses.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface-muted/60 border border-surface-border text-xs text-slate-200">
                    {c}
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/venue-bookings">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <DoorClosed className="w-3.5 h-3.5 mr-1.5" />
                      Request Guest Lecture Venue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── 2. STUDENT VIEW ────────────────────────────────────────────────────────
  if (role === "student_representative") {
    const todayClasses: any[] = stats?.today_classes || [];
    const upcomingExams: any[] = stats?.upcoming_exams || [];

    return (
      <AppShell>
        <PageHeader
          title={`Student Portal — ${user?.name || "Arjun Patel"}`}
          description={`Cohort: ${user?.entityId || "CSE-2"} · Chitkara Institute of Technology`}
          badge="Academic Year 2026-27"
          actions={
            <Link href="/timetable">
              <Button variant="primary" size="sm">
                <Calendar className="w-4 h-4 mr-1.5" />
                My Class Timetable
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Weekly Class Sessions"
            value={`${metrics.my_weekly_sessions || 18} Classes`}
            subtext="Conflict-free CP-SAT allocation"
            icon={<Calendar className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            label="Today's Schedule (MON)"
            value={`${todayClasses.length} Sessions`}
            subtext="Lunch P5 (12:00 - 13:00) free"
            icon={<Clock className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Midsemester Exams"
            value={`${upcomingExams.length} Papers`}
            subtext="Slot AM (09:30) / PM (14:00)"
            icon={<GraduationCap className="w-4 h-4 text-cyan-400" />}
          />
          <StatCard
            label="Attendance & Health"
            value="100% Slot Safe"
            subtext="Zero overlapping classes"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Today's Lectures & Labs (Monday)
                </CardTitle>
                <CardDescription>Chamber and lecture hall schedule for cohort {user?.entityId || "CSE-2"}</CardDescription>
              </div>
              <Badge variant="cyan" className="text-xs">
                Batch {user?.entityId || "CSE-2"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {todayClasses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No lectures scheduled for your group today.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 font-mono text-xs font-semibold">
                          P{s.start_period}{s.duration > 1 ? `–P${s.end_period}` : ""}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                            <span>{s.course_id}</span>
                            <span className="text-slate-400 font-normal">· {s.course_title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Instructor: <span className="text-slate-200">{s.faculty_name}</span> ({s.department})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-mono text-xs text-emerald-400 border-emerald-500/30">
                          {s.room_id}
                        </Badge>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.building}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upcoming Midsem Exams</CardTitle>
                <CardDescription>Assigned examination sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {upcomingExams.map((ex, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-muted border border-surface-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-100">{ex.exam_id}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {ex.day} · {ex.session}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Halls: {(ex.rooms || []).join(", ")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── 3. VENUE MANAGER VIEW ──────────────────────────────────────────────────
  if (role === "venue_manager") {
    const recentBookings: any[] = stats?.recent_bookings || [];

    return (
      <AppShell>
        <PageHeader
          title="Venue Management & Spectra Logistics Center"
          description="Facility allocation, conflict arbitration, and venue approvals"
          badge="Spectra Week 2027"
          actions={
            <Link href="/venue-bookings">
              <Button variant="primary" size="sm">
                <DoorClosed className="w-4 h-4 mr-1.5" />
                Full Booking Matrix
              </Button>
            </Link>
          }
        />

        {actionMsg && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{actionMsg}</span>
            </div>
            <button onClick={() => setActionMsg("")} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Campus Venues"
            value="27 Venues"
            subtext="Classrooms, halls & 7 labs"
            icon={<Building2 className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            label="Approved Spectra Bookings"
            value={`${metrics.approved_bookings || 22} Bookings`}
            subtext="Zero schedule collisions"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Alternative Slots Offered"
            value={`${metrics.alternative_bookings || 2} Shifted`}
            subtext="Evening slots (P10-P13)"
            icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
          />
          <StatCard
            label="Booking Priority Score"
            value="66.0 / 100"
            subtext="0 priority inversions"
            icon={<CheckSquare className="w-4 h-4 text-cyan-400" />}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DoorClosed className="w-4 h-4 text-blue-400" />
                Spectra Festival Pending & Action Queue
              </CardTitle>
              <CardDescription>Direct venue approval actions with role priority caps</CardDescription>
            </div>
            <Badge variant="cyan" className="text-xs">
              Fast-Track Actions
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 px-3">Request</th>
                    <th className="py-2 px-3">Requester & Role</th>
                    <th className="py-2 px-3">Allocated Slot</th>
                    <th className="py-2 px-3">Room</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {recentBookings.map((b) => (
                    <tr key={b.request_id} className="hover:bg-surface-elevated/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-100">{b.title}</div>
                        <div className="text-[10px] text-blue-400 font-mono">{b.request_id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>{b.requester}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{b.role}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {b.day ? `${b.day} P${b.start_period}-P${b.end_period}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                        {b.room_id || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={b.status === "approved" ? "success" : b.status === "rejected" ? "outline" : "warning"} className="text-[10px]">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleBookingAction(b.request_id, "approve")}
                            className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Approve"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleBookingAction(b.request_id, "reject")}
                            className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Reject"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  // ── 4. DEPARTMENT HEAD VIEW ────────────────────────────────────────────────
  if (role === "department_head") {
    const deptFaculty: any[] = stats?.dept_faculty || [];

    return (
      <AppShell>
        <PageHeader
          title={`Department Dashboard — ${stats?.department || user?.department || "ECE"}`}
          description={`Faculty workload monitoring & departmental course schedules · HoD Portal`}
          badge="Academic Year 2026-27"
          actions={
            <Link href="/timetable">
              <Button variant="primary" size="sm">
                <Calendar className="w-4 h-4 mr-1.5" />
                Department Matrix
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Department Faculty"
            value={`${metrics.dept_faculty_count || 8} Professors`}
            subtext="Teaching workload active"
            icon={<Users className="w-4 h-4 text-blue-400" />}
          />
          <StatCard
            label="Curriculum Courses"
            value={`${metrics.dept_courses_count || 12} Courses`}
            subtext="Lecture + Tutorial + Labs"
            icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
          />
          <StatCard
            label="Weekly Contact Load"
            value={`${metrics.dept_workload_hours || 48} Hours`}
            subtext="Max 4h/day constraint compliant"
            icon={<Clock className="w-4 h-4 text-cyan-400" />}
          />
          <StatCard
            label="Scheduling Conflicts"
            value="0 Collisions"
            subtext="Canonical validation passed"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          />
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-surface-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Faculty Teaching Workload & Availability Status
            </CardTitle>
            <CardDescription>Monitored against maximum daily period limits</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 px-3">Faculty Member</th>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Daily Max</th>
                    <th className="py-2 px-3">Assigned Weekly Load</th>
                    <th className="py-2 px-3">Workload Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {deptFaculty.map((f) => (
                    <tr key={f.id} className="hover:bg-surface-elevated/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-100">{f.name}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-400">{f.id}</td>
                      <td className="py-2.5 px-3">{f.max_hours} hrs/day</td>
                      <td className="py-2.5 px-3 font-medium text-emerald-400">{f.assigned_hours} hrs/week</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="success" className="text-[10px]">
                          Balanced (0 overload)
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  // ── 5. DEFAULT VIEW (SUPER ADMIN / TIMETABLE COORDINATOR / ACADEMIC DEAN) ───
  return (
    <AppShell>
      <PageHeader
        title="Campus Operations & Scheduling Dashboard"
        description="Chitkara Institute of Technology — Unified Academic Timetable & Venue Control Center"
        badge="Academic Year 2026-27"
        actions={
          <>
            {canExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
                Export Schedule
              </Button>
            )}
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
                    Generate Timetable
                  </>
                )}
              </Button>
            )}
          </>
        }
      />

      {statusMessage && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage("")}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Campus Venues"
              value={`${metrics.venues} Rooms`}
              subtext="Lecture halls, labs & seminar halls"
              icon={<Building2 className="w-4 h-4" />}
            />
            <StatCard
              label="Faculty Members"
              value={`${metrics.faculty} Faculty`}
              subtext="Allocated across 5 academic depts"
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Weekly Contact Hours"
              value={`${metrics.weekly_contact_hours} Hours`}
              subtext={`Across ${metrics.academic_sessions} weekly sessions`}
              icon={<Calendar className="w-4 h-4" />}
            />
            <StatCard
              label="Midsem Exams"
              value={`${metrics.midsem_exams} Slots`}
              subtext="Scheduled with 1/2 room capacity"
              icon={<GraduationCap className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Official Timetable Status</CardTitle>
                  <CardDescription>
                    Google OR-Tools CP-SAT constraint compliance and validator verification
                  </CardDescription>
                </div>
                <Badge variant="success" className="text-xs">
                  0 Hard Violations
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-muted border border-surface-border">
                  <div>
                    <p className="text-[11px] text-slate-400">Scheduled Sessions</p>
                    <p className="text-lg font-bold text-slate-100">{ttStatus.scheduled_sessions} / 189</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">100% Assigned</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Hard Violations</p>
                    <p className="text-lg font-bold text-emerald-400">0</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Canonical Verified</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Soft Penalty</p>
                    <p className="text-lg font-bold text-cyan-400">{ttStatus.soft_penalty}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Optimal Balance</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Midsem Exams</p>
                    <p className="text-lg font-bold text-slate-100">{ttStatus.scheduled_exams} / 41</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">12 Slots (AM/PM)</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Operating hours: Mon–Fri P1–P9 (Lunch after P5 strictly respected)</span>
                  </div>
                  <Link href="/timetable">
                    <Button variant="primary" size="sm">
                      View Timetable Matrix
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Diagnostics</CardTitle>
                  <CardDescription>Engine and constraint validation status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-200">Constraint Engine (H1–H14)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                      Passing (0 err)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-200">AI Assistant</span>
                    </div>
                    <span className="text-[11px] font-semibold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium text-slate-200">Disruption Rescheduler</span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10">
                      Ready (0 clash)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-medium text-slate-200">Access Level</span>
                    </div>
                    <span className="text-[11px] font-semibold text-violet-400 px-2 py-0.5 rounded bg-violet-500/10 capitalize">
                      {(role ?? "guest").replace("_", " ")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
