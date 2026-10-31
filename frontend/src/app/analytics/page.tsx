"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, DoorClosed, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetchBackend("/analytics/");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Analytics could not be loaded.");
        setData(result);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Analytics service is unavailable.");
      } finally { setLoading(false); }
    })();
  }, []);

  const summary = data?.summary || {};
  const venues = data?.top_utilized_venues || [];
  const conflicts = data?.current_conflicts || [];
  const pending = data?.pending_approvals || [];

  return <AppShell>
    <PageHeader title="Campus Analytics & Utilization" description="Live room use, booking approvals, and timetable overlap checks from the active schedule." badge="Live schedule metrics" />
    {error && <div className="mb-4 rounded border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</div>}
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Average room use" value={summary.average_room_utilization === undefined ? "—" : `${summary.average_room_utilization}%`} subtext="Across official campus rooms" icon={<BarChart3 className="h-4 w-4" />} />
      <StatCard label="Weekly teaching hours" value={summary.total_weekly_hours ?? "—"} subtext={`${summary.total_sessions ?? 0} active placements`} icon={<Activity className="h-4 w-4 text-blue-400" />} />
      <StatCard label="Current overlaps" value={summary.current_conflicts ?? "—"} subtext="Room, faculty, and cohort checks" icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} />
      <StatCard label="Pending approvals" value={summary.pending_approvals ?? "—"} subtext="Venue requests awaiting a decision" icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
    </div>

    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm">Active timetable conflicts</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-400" /> : conflicts.length ? conflicts.map((item: any, index: number) => <div key={index} className="rounded border border-rose-500/20 bg-rose-500/5 p-2 text-xs text-slate-300"><b>{item.day} P{item.periods?.[0]}–P{item.periods?.[1]}</b> · {item.sessions?.join(" / ")}<p className="mt-1 text-[11px] text-rose-200">{item.reasons?.join(", ")}</p></div>) : <p className="text-xs text-emerald-300">No room, faculty, or student-group overlaps detected.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Pending venue approvals</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-400" /> : pending.length ? pending.map((item: any) => <div key={item.request_id} className="rounded border border-surface-border bg-surface-muted p-2 text-xs text-slate-300"><span className="font-mono text-blue-300">{item.request_id}</span> · {item.title} · {item.requester}</div>) : <p className="text-xs text-slate-400">No booking approvals are waiting.</p>}</CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><DoorClosed className="h-4 w-4 text-blue-400" />Room utilization</CardTitle></CardHeader><CardContent>{loading ? <div className="py-10 text-center text-xs text-slate-400">Loading room use…</div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[11px] uppercase text-slate-400"><tr><th className="py-2">Room</th><th>Type</th><th>Capacity</th><th>Hours booked</th><th>Utilization</th></tr></thead><tbody className="divide-y divide-surface-border/50">{venues.map((room: any) => <tr key={room.room_id}><td className="py-2 font-medium text-slate-100">{room.room_id} · {room.name}</td><td className="capitalize">{room.type?.replaceAll("_", " ")}</td><td>{room.capacity}</td><td>{room.hours} / 45</td><td className="font-mono text-cyan-300">{room.utilization_rate}%</td></tr>)}</tbody></table></div>}</CardContent></Card>
  </AppShell>;
}
