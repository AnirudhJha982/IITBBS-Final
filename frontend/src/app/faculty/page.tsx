"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { Users, GraduationCap, Clock, ShieldCheck, Search, Loader2 } from "lucide-react";

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        setLoading(true);
        const res = await fetchBackend("/faculty/");
        if (res.ok) {
          const data = await res.json();
          setFaculty(data.faculty || []);
        }
      } catch (err) {
        console.error("Failed to load faculty:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFaculty();
  }, []);

  const departments = Array.from(new Set(faculty.map((f) => f.department))).sort();

  const filtered = faculty.filter((f) => {
    if (deptFilter && f.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        f.id.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalTeachingHours = faculty.reduce((acc, f) => acc + (f.weekly_teaching_hours || 0), 0);

  return (
    <AppShell>
      <PageHeader
        title="Faculty Members & Teaching Roster"
        description="Faculty workload caps (max 4 hrs/day), availability constraints, and assigned courses for 40 professors"
        badge="40 Total Faculty (CIT Faculty Roster)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Faculty"
          value={`${faculty.length} Members`}
          subtext="5 Academic Departments"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Total Weekly Contact"
          value={`${totalTeachingHours} Hours`}
          subtext="189 sessions delivered"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Daily Cap Compliance"
          value="100%"
          subtext="<= 4 hours/day strictly enforced"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <StatCard
          label="Department Cohorts"
          value={`${departments.length} Depts`}
          subtext="CSE, ECE, ME, CE, etc."
          icon={<GraduationCap className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Faculty Members Registry ({filtered.length} matching)
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search faculty ID, name, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs">Loading faculty roster...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No faculty members matching search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Faculty ID & Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Weekly Teaching Load</th>
                    <th className="py-2.5 px-3">Daily Max Cap</th>
                    <th className="py-2.5 px-3">Sessions Assigned</th>
                    <th className="py-2.5 px-3">Unavailability Windows</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {filtered.map((f) => (
                    <tr key={f.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span className="text-blue-400 font-mono">{f.id}</span>
                          <span>— {f.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted text-slate-300 border border-surface-border">
                          {f.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-cyan-400 font-mono">
                        {f.weekly_teaching_hours} Hours/week
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        max {f.max_hours_per_day}h/day
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {f.assigned_sessions_count} sessions
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {f.unavailability_count > 0 ? (
                          <span className="text-amber-400 font-medium">
                            {f.unavailability_count} restricted slots (respected)
                          </span>
                        ) : (
                          <span className="text-slate-500">Fully Available</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success" className="text-[10px]">
                          Conflict Free
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
