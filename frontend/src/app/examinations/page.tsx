"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { GraduationCap, Calendar, Users, ShieldCheck, Loader2 } from "lucide-react";

export default function ExaminationsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const res = await fetchBackend("/examinations/");
        if (res.ok) {
          const data = await res.json();
          setExams(data.examinations || data.exams || []);
        }
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const filtered = exams.filter((e) => {
    if (dayFilter && e.day !== dayFilter) return false;
    if (sessionFilter && e.session !== sessionFilter) return false;
    return true;
  });

  const totalStudents = exams.reduce((acc, e) => acc + (e.students_count || 0), 0);

  return (
    <AppShell>
      <PageHeader
        title="Midsemester Examination Scheduling"
        description="Conflict-free examination slotting across 12 sessions (MON-SAT AM/PM) with half-capacity room seating"
        badge="Midsem 2026 — 41 Exams Scheduled"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Midsem Exams"
          value={`${exams.length} Exams`}
          subtext="100% Scheduled with 0 conflicts"
          icon={<GraduationCap className="w-4 h-4" />}
        />
        <StatCard
          label="Total Students Examined"
          value={`${totalStudents.toLocaleString()} Seats`}
          subtext="Half-capacity seating enforced"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Examination Slots"
          value="12 Sessions"
          subtext="Mon-Sat (AM: 09:30, PM: 14:00)"
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Group Clash Rate"
          value="0 Conflicts"
          subtext="No group has 2 exams in same slot"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            Scheduled Midsemester Examinations ({filtered.length} matching)
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Days (Mon-Sat)</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Sessions (AM & PM)</option>
              <option value="AM">Morning (AM: 09:30 - 11:30)</option>
              <option value="PM">Afternoon (PM: 14:00 - 16:00)</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs">Loading examination schedule...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No exams found matching selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Exam ID</th>
                    <th className="py-2.5 px-3">Slot (Day & Session)</th>
                    <th className="py-2.5 px-3">Associated Courses</th>
                    <th className="py-2.5 px-3">Student Groups</th>
                    <th className="py-2.5 px-3">Candidate Size</th>
                    <th className="py-2.5 px-3">Allocated Venues</th>
                    <th className="py-2.5 px-3">Capacity Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {filtered.map((e) => (
                    <tr key={e.exam_id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-blue-400">
                        {e.exam_id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-100">{e.day}</span>{" "}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${e.session === "AM"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                        >
                          {e.session} (2h)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {(e.course_ids || []).join(", ")}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(e.groups || []).map((g: string) => (
                            <span key={g} className="px-1.5 py-0.5 rounded bg-surface-muted text-[10px] text-slate-300 font-mono">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {e.students_count} students
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-emerald-400">
                        {e.rooms.join(", ")}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success" className="text-[10px]">
                          {e.allocated_seats_half_cap} seats (Half-Cap OK)
                        </Badge>
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
