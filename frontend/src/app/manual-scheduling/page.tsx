"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function ManualSchedulingPage() {
  const { role } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedDay, setSelectedDay] = useState("MON");
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    conflicts: string[];
    details: string;
  } | null>(null);

  const days = ["MON", "TUE", "WED", "THU", "FRI"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const canSchedule = role === "super_admin" || role === "timetable_coordinator";

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [scheduleResponse, roomResponse] = await Promise.all([
        fetchBackend("/timetable/"),
        fetchBackend("/rooms/"),
      ]);
      const [scheduleData, roomData] = await Promise.all([scheduleResponse.json(), roomResponse.json()]);
      const rows = scheduleData.sessions || [];
      setSessions(rows);
      setRooms(roomData.rooms || []);
      if (rows.length && !selectedSession) setSelectedSession(rows[0].session_id);
      if (roomData.rooms?.length && !selectedRoom) setSelectedRoom(roomData.rooms[0].id);
    } catch {
      setValidationResult({ valid: false, conflicts: ["Could not load the current schedule and official rooms."], details: "The manual scheduler is unavailable until the schedule data loads." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOptions(); }, []);

  const handleValidate = async () => {
    try {
      const response = await fetchBackend("/timetable/validate-slot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession, day: selectedDay, start_period: selectedPeriod, room_id: selectedRoom }),
      });
      const data = await response.json();
      setValidationResult({
        valid: Boolean(data.valid),
        conflicts: data.conflicts || (response.ok ? [] : [data.message || "Validation failed."]),
        details: data.message || (data.valid ? "Placement passed hard-constraint validation." : "Resolve the conflicts before saving."),
      });
    } catch {
      setValidationResult({ valid: false, conflicts: ["The validation service could not be reached."], details: "No schedule change was saved." });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetchBackend("/timetable/manual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession, day: selectedDay, start_period: selectedPeriod, room_id: selectedRoom }),
      });
      const data = await response.json();
      setValidationResult({ valid: Boolean(data.valid), conflicts: data.conflicts || [], details: data.message || "Manual placement was not saved." });
      if (data.success) await loadOptions();
    } catch {
      setValidationResult({ valid: false, conflicts: ["The schedule service could not be reached."], details: "No schedule change was saved." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Manual Scheduling & Real-Time Constraint Validation"
        description="Place a real dataset session; the server checks conflicts against the active timetable before saving."
        badge={canSchedule ? "Authorized editor" : "Read only"}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-emerald-500/20 bg-emerald-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Conflict checks</p>
              <p className="text-[11px] text-slate-400">Zero room, faculty, or cohort overlap</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-semibold text-blue-400">Capacity Fit Verification</p>
              <p className="text-[11px] text-slate-400">Room size must strictly accommodate cohort</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-400">Time & Lab Boundaries</p>
              <p className="text-[11px] text-slate-400">Lunch, allowed lab starts, and faculty availability</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 border-b border-surface-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Slot Assignment Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Academic Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-surface-border bg-surface-muted text-xs text-slate-200"
              >
                {sessions.map((s) => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.session_id} · {s.course_title} ({s.duration}h)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Target Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-surface-border bg-surface-muted text-xs text-slate-200"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Start Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-surface-border bg-surface-muted text-xs text-slate-200"
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>P{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Room / Venue</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-surface-border bg-surface-muted text-xs text-slate-200"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.id} · {r.name} ({r.capacity})</option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full text-xs mt-2"
              onClick={handleValidate}
              disabled={loading || !selectedSession || !selectedRoom || !canSchedule}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {loading ? "Loading official schedule…" : "Validate placement"}
            </Button>
            {!canSchedule && <p className="text-[11px] text-amber-300">Only an administrator or timetable coordinator can save manual placements.</p>}
          </CardContent>
        </Card>

        {/* Validation Output */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-surface-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Live Constraint Evaluation Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {validationResult ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    validationResult.valid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                  }`}
                >
                  {validationResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-semibold">
                    {validationResult.valid ? "Validation Passed" : "Constraint Conflict Detected"}
                    </p>
                    <p className="text-xs mt-1 text-slate-300">{validationResult.details}</p>
                    {validationResult.conflicts.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-rose-300 list-disc list-inside">
                        {validationResult.conflicts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {validationResult.valid && canSchedule && (
                  <Button variant="cyan" size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save validated placement"}
                  </Button>
                )}

                <div className="p-3.5 rounded-lg bg-surface-muted border border-surface-border text-xs text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-200">Session Profile:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Session ID: <span className="font-mono text-blue-400">{selectedSession}</span></div>
                    <div>Target Day: <span className="font-semibold text-slate-100">{selectedDay}</span></div>
                    <div>Period: <span className="font-semibold text-slate-100">P{selectedPeriod}</span></div>
                    <div>Venue: <span className="font-mono text-emerald-400 font-semibold">{selectedRoom}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2 text-xs">
                <Sliders className="w-8 h-8 text-blue-400 mb-1" />
                <p className="font-semibold text-slate-200">Workbench Ready</p>
                <p className="max-w-md">Select an academic session and target slot on the left to run immediate constraint validation against the 188 master schedule slots.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
