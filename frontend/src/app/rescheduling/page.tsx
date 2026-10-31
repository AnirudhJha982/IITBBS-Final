"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, CheckCircle2, Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

export default function ReschedulingPage() {
  const { role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [changeType, setChangeType] = useState("sample");
  const [targetId, setTargetId] = useState("");
  const [changeDay, setChangeDay] = useState("MON");
  const [periodText, setPeriodText] = useState("1-9");
  const [changeReason, setChangeReason] = useState("");
  const canPropose = role === "super_admin" || role === "timetable_coordinator";
  const canApprove = role === "super_admin";

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetchBackend("/rescheduling/status");
      const result = await response.json();
      if (response.ok) setData(result);
      else setMessage(result.message || "Could not load rescheduling status.");
    } catch {
      setMessage("Rescheduling service is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, []);

  const createProposal = async () => {
    setBusy(true);
    setMessage("Solving and validating a proposal. The live timetable remains unchanged.");
    try {
      const periods = periodText.split(",").flatMap((part) => {
        const [first, last] = part.trim().split("-").map(Number);
        return Number.isFinite(last) ? Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index) : [first];
      }).filter((period) => period >= 1 && period <= 9);
      const change = changeType === "faculty_unavailable"
        ? { type: changeType, faculty_id: targetId.trim(), days: [changeDay], periods, reason: changeReason }
        : { type: changeType, room_id: targetId.trim(), days: [changeDay], periods, reason: changeReason };
      const body = changeType === "sample" ? undefined : JSON.stringify({ id: `manual-${Date.now()}`, description: changeReason || "Admin entered schedule change", changes: [change] });
      const response = await fetchBackend("/rescheduling/propose", { method: "POST", ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}) });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const detail = result.message;
        throw new Error(typeof detail === "string" ? detail : [detail?.message, ...(detail?.conflicts || [])].filter(Boolean).join(" "));
      }
      setMessage(result.message);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No proposal was saved.");
    } finally {
      setBusy(false);
    }
  };

  const approveProposal = async () => {
    setBusy(true);
    try {
      const response = await fetchBackend("/rescheduling/approve", { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Approval failed.");
      setMessage(result.message);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The proposal was not applied.");
    } finally {
      setBusy(false);
    }
  };

  const exportSchedule = async () => {
    const response = await fetchBackend("/rescheduling/export");
    if (!response.ok) { setMessage("There is no schedule proposal to export yet."); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "schedule_after.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const metrics = data?.metrics || {};
  const changes = data?.pending_proposal?.changes || [];
  const disruption = data?.disruption || {};

  return (
    <AppShell>
      <PageHeader
        title="Timetable Disruption & Rescheduling"
        description="Create a validated repair proposal, review every change, and apply it only after Admin approval."
        badge={data?.status === "PENDING_ADMIN_APPROVAL" ? "Pending approval" : "No pending proposal"}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportSchedule}><Download className="w-4 h-4 mr-1.5" />Export proposal</Button>
            {canPropose && <Button variant="primary" size="sm" onClick={createProposal} disabled={busy || loading || (changeType !== "sample" && (!targetId.trim() || !changeReason.trim() || !periodText.trim()))}><RefreshCw className="w-4 h-4 mr-1.5" />{busy ? "Working…" : "Propose repair"}</Button>}
            {canApprove && data?.pending_proposal && <Button variant="cyan" size="sm" onClick={approveProposal} disabled={busy}><CheckCircle2 className="w-4 h-4 mr-1.5" />Approve and apply</Button>}
          </>
        }
      />

      {message && <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-100">{message}</div>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Current sessions" value={String(metrics.total_baseline_sessions ?? "—")} subtext="Active published timetable" icon={<ShieldCheck className="w-4 h-4 text-blue-400" />} />
        <StatCard label="Sessions moved" value={String(metrics.total_displaced ?? "—")} subtext="Only counted from a live proposal" icon={<RefreshCw className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Time changes" value={String(metrics.sessions_time_shifted ?? "—")} subtext="Day or period changed" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
        <StatCard label="Hard conflicts" value={metrics.hard_violations === null || metrics.hard_violations === undefined ? "Not checked" : String(metrics.hard_violations)} subtext="Candidate checks run before approval" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Disruption scenario</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-300">
          {canPropose && <div className="grid grid-cols-1 gap-2 rounded border border-surface-border bg-surface-muted p-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-slate-400">Change<select value={changeType} onChange={(e) => setChangeType(e.target.value)} className="mt-1 h-8 w-full rounded border border-surface-border bg-surface px-2 text-slate-100"><option value="sample">Official sample scenario</option><option value="faculty_unavailable">Faculty leave / unavailable</option><option value="room_unavailable">Room closure</option></select></label>
            {changeType !== "sample" && <>
              <label className="text-slate-400">{changeType === "faculty_unavailable" ? "Faculty ID" : "Room ID"}<input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder={changeType === "faculty_unavailable" ? "F07" : "CR-102"} className="mt-1 h-8 w-full rounded border border-surface-border bg-surface px-2 text-slate-100" /></label>
              <label className="text-slate-400">Day<select value={changeDay} onChange={(e) => setChangeDay(e.target.value)} className="mt-1 h-8 w-full rounded border border-surface-border bg-surface px-2 text-slate-100">{["MON", "TUE", "WED", "THU", "FRI"].map(day => <option key={day}>{day}</option>)}</select></label>
              <label className="text-slate-400">Periods (e.g. 1-5,7)<input value={periodText} onChange={(e) => setPeriodText(e.target.value)} className="mt-1 h-8 w-full rounded border border-surface-border bg-surface px-2 text-slate-100" /></label>
              <label className="text-slate-400">Reason<input value={changeReason} onChange={(e) => setChangeReason(e.target.value)} className="mt-1 h-8 w-full rounded border border-surface-border bg-surface px-2 text-slate-100" /></label>
            </>}
            <p className="sm:col-span-2 lg:col-span-5 text-[10px] text-slate-500">This creates a proposal only. The active timetable changes only after a Super Admin approves it.</p>
          </div>}
          <p>{disruption.description || "Load a disruption to prepare a repair."}</p>
          {(disruption.changes || []).map((change: any, index: number) => <p key={index} className="rounded border border-surface-border bg-surface-muted p-2">{change.type.replaceAll("_", " ")} · {change.faculty_id || change.room_id || change.session_id || change.session?.id || "dataset change"}{change.reason ? ` · ${change.reason}` : ""}</p>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-surface-border/50 pb-3">
          <div><CardTitle className="text-sm">Proposal changes</CardTitle><p className="mt-1 text-xs text-slate-400">{loading ? "Loading…" : changes.length ? `${changes.length} sessions added, removed, or moved.` : "No proposal is waiting for approval."}</p></div>
        </CardHeader>
        <CardContent className="pt-3">
          {changes.length > 0 ? <div className="max-h-[32rem] overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-surface text-slate-400"><tr><th className="py-2">Session</th><th>Current placement</th><th>Proposed placement</th><th>Change</th></tr></thead><tbody className="divide-y divide-surface-border/40">{changes.map((change: any) => <tr key={change.session_id}><td className="py-2 font-mono text-blue-300">{change.session_id}</td><td>{change.before ? `${change.before.day} P${change.before.start_period} · ${change.before.room_id}` : "—"}</td><td>{change.after ? `${change.after.day} P${change.after.start_period} · ${change.after.room_id}` : "—"}</td><td className="capitalize">{change.change_type}</td></tr>)}</tbody></table></div> : <div className="py-10 text-center text-xs text-slate-400">{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create a proposal to see the exact changes here."}</div>}
          {data?.pending_proposal && !canApprove && <p className="mt-3 rounded bg-amber-500/10 p-3 text-xs text-amber-200">Waiting for a Super Admin to approve. The published timetable has not changed.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}
