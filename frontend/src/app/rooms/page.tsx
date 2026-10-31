"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { Building2, Layers, Cpu, CheckCircle2, Search, Loader2 } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        const res = await fetchBackend("/rooms/");
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms || []);
        }
      } catch (err) {
        console.error("Failed to load rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  const types = Array.from(new Set(rooms.map((r) => r.type))).sort();

  const filtered = rooms.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const avgUtilization = rooms.length
    ? Math.round(rooms.reduce((acc, r) => acc + (r.utilization_rate || 0), 0) / rooms.length)
    : 0;

  return (
    <AppShell>
      <PageHeader
        title="Campus Venues & Rooms Directory"
        description="Physical capacity, equipment profiles, and schedule utilization for all 27 campus venues"
        badge="27 Total Venues (CIT Campus)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Venues"
          value={`${rooms.length} Rooms`}
          subtext="Official Chitkara dataset"
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          label="Total Seating Capacity"
          value={`${totalCapacity.toLocaleString()} Seats`}
          subtext="Across all campus blocks"
          icon={<Layers className="w-4 h-4" />}
        />
        <StatCard
          label="Specialized Labs"
          value={`${rooms.filter((r) => r.type?.includes("lab")).length} Labs`}
          subtext="Computing, hardware & science"
          icon={<Cpu className="w-4 h-4" />}
        />
        <StatCard
          label="Avg Utilization Rate"
          value={`${avgUtilization}%`}
          subtext="Weekly timetable occupancy"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Campus Venues Registry ({filtered.length} matching)
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search room ID, name, building..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200"
            >
              <option value="">All Room Types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs">Loading campus venues...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No venues matching search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Room ID & Name</th>
                    <th className="py-2.5 px-3">Building</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">Features & Accessibility</th>
                    <th className="py-2.5 px-3">Weekly Hours</th>
                    <th className="py-2.5 px-3">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span className="text-blue-400 font-mono">{r.id}</span>
                          <span>— {r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{r.building}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] capitalize bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                          {r.type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {r.capacity} seats
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {r.accessible && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              Wheelchair Accessible
                            </span>
                          )}
                          {r.features?.map((f: string) => (
                            <span key={f} className="px-1.5 py-0.5 rounded bg-surface-muted text-[10px] text-slate-400">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {r.weekly_hours_booked}h / 45h
                      </td>
                      <td className="py-3 px-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                r.utilization_rate > 70
                                  ? "bg-amber-400"
                                  : r.utilization_rate > 30
                                  ? "bg-emerald-400"
                                  : "bg-blue-400"
                              }`}
                              style={{ width: `${Math.min(r.utilization_rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{r.utilization_rate}%</span>
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
