"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";
import { GraduationCap, Loader2 } from "lucide-react";

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

  const filtered = exams
    .filter((e) => {
      if (dayFilter && e.day !== dayFilter) return false;
      if (sessionFilter && e.session !== sessionFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
      if (dayOrder !== 0) return dayOrder;
      const sessionOrder = (a.session === "AM" ? 0 : 1) - (b.session === "AM" ? 0 : 1);
      return sessionOrder || a.exam_id.localeCompare(b.exam_id);
    });

  return (
    <AppShell>
      <Card className="overflow-hidden border-[#e3e8ef] bg-white shadow-[0_14px_40px_rgba(22,28,24,0.08)]">
        <CardHeader className="flex flex-col gap-4 border-b border-[#e8edf3] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#18243a]">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Scheduled Midsemester Examinations ({filtered.length} matching)
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="h-11 min-w-[185px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-4 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Days (Mon-Sat)</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="h-11 min-w-[235px] rounded-lg border border-[#dce4ee] bg-[#f8fafc] px-4 text-sm text-[#35445b] shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Sessions (AM & PM)</option>
              <option value="AM">Morning (AM: 09:30 - 11:30)</option>
              <option value="PM">Afternoon (PM: 14:00 - 16:00)</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[#65748a]">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm">Loading examination schedule…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#65748a]">
              No exams found matching selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto px-5 pb-3">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e5ebf2] bg-[#fbfcfe] text-[12px] font-semibold uppercase tracking-wide text-[#5b6a80]">
                    <th className="w-[115px] px-4 py-4">Exam ID</th>
                    <th className="w-[180px] px-4 py-4">Slot (Day &amp; Session)</th>
                    <th className="w-[170px] px-4 py-4">Associated Courses</th>
                    <th className="w-[180px] px-4 py-4">Student Groups</th>
                    <th className="w-[160px] px-4 py-4">Candidate Size</th>
                    <th className="w-[220px] px-4 py-4">Allocated Venues</th>
                    <th className="w-[175px] px-4 py-4">Capacity Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf3] text-sm text-[#344157]">
                  {filtered.map((e) => (
                    <tr key={e.exam_id} className="transition-colors odd:bg-white even:bg-[#f8fafd] hover:bg-blue-50/70">
                      <td className="px-4 py-4 font-mono font-bold text-blue-700">
                        {e.exam_id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="font-semibold text-[#1f2b3f]">{e.day}</span>{" "}
                        <span
                          className={`ml-1 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${e.session === "AM"
                              ? "border-[#fed7aa] bg-[#fff7ed] text-[#b45309]"
                              : "border-[#e9d5ff] bg-[#faf5ff] text-[#7e22ce]"
                            }`}
                        >
                          {e.session} (2h)
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-[#40516a]">
                        {(e.course_ids || []).join(", ")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(e.groups || []).map((g: string) => (
                            <span key={g} className="rounded-md bg-[#f4f6f9] px-2 py-1 font-mono text-[11px] text-[#43536b]">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#27364d]">
                        {e.students_count} students
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-[#07805d]">
                        {e.rooms.join(", ")}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex min-h-[44px] max-w-[155px] items-center rounded-full border border-[#a9e7d6] bg-[#e7f8f2] px-3.5 py-1.5 text-[13px] font-medium leading-5 text-[#087f5b]">
                          {e.allocated_seats_half_cap} seats (Half-Cap OK)
                        </span>
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
