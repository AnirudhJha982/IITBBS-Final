"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/auth";
import {
  DoorClosed,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function VenueBookingsPage() {
  const { role } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [bookingScore] = useState(66.0);
  const [actionMsg, setActionMsg] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [requestText, setRequestText] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualEvent, setManualEvent] = useState({ title: "", attendance: 40, duration_periods: 1, day: "MON", start_period: 1, room_id: "", reason: "" });
  const [decisionInputs, setDecisionInputs] = useState<Record<string, { reason: string; day: string; period: string; room: string }>>({});

  const canApprove = role ? PERMISSIONS.canApproveBookings(role) : false;
  const canRequest = role ? PERMISSIONS.canRequestBooking(role) : false;

  const loadBookings = async () => {
    try {
      setLoading(true);
      const needsRoomCatalog = role === "super_admin" || role === "venue_manager";
      const [res, roomRes] = await Promise.all([
        fetchBackend("/bookings/"),
        needsRoomCatalog ? fetchBackend("/rooms/") : Promise.resolve(null),
      ]);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
      if (roomRes?.ok) {
        const roomData = await roomRes.json();
        const availableRooms = roomData.rooms || [];
        setRooms(availableRooms);
        setManualEvent((current) => current.room_id || !availableRooms.length ? current : { ...current, room_id: availableRooms[0].id });
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleDecision = async (
    requestId: string,
    action: "approve" | "reject" | "alternative",
    booking: any
  ) => {
    try {
      setActioning(requestId);
      const endpoint = `/bookings/${action}`;
      const inputs = decisionInputs[requestId] || { reason: "", day: "", period: "", room: "" };
      const res = await fetchBackend(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          reason: inputs.reason,
          day: inputs.day || booking.day,
          start_period: Number(inputs.period || booking.start_period || 0),
          room_id: inputs.room || booking.room_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(data.message || `${requestId} updated.`);
        if (data.booking) {
          setBookings((current) => current.map((item) => item.request_id === requestId ? data.booking : item));
        }
      } else {
        const detail = data.message;
        setActionMsg(typeof detail === "string" ? detail : detail?.message || data.error?.details?.[0]?.msg || "Action failed; no decision was saved.");
      }
    } catch {
      setActionMsg("Network error performing action.");
    } finally {
      setActioning(null);
    }
  };

  const handleParseRequest = async () => {
    try {
      setRequestBusy(true);
      const res = await fetchBackend("/bookings/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: requestText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not parse this request.");
      setDraft(data.proposal);
      setActionMsg(`Draft prepared for review. Please check the extracted details before submitting.`);
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : "Could not parse this request.");
    } finally {
      setRequestBusy(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      setRequestBusy(true);
      const res = await fetchBackend("/bookings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(typeof data.message === "string" ? data.message : "Complete all required booking fields first.");
      setActionMsg(data.message);
      setRequestText("");
      setDraft(null);
      if (data.booking) setBookings((current) => [data.booking, ...current.filter((item) => item.request_id !== data.booking.request_id)]);
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : "Booking request was not submitted.");
    } finally {
      setRequestBusy(false);
    }
  };

  const handleManualSchedule = async () => {
    try {
      setManualBusy(true);
      const response = await fetchBackend("/bookings/manual", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(manualEvent),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const detail = result.message;
        throw new Error(typeof detail === "string" ? detail : [detail?.message, ...(detail?.conflicts || [])].filter(Boolean).join(" "));
      }
      setActionMsg(result.message);
      setManualEvent((current) => ({ ...current, title: "", reason: "" }));
      if (result.booking) setBookings((current) => [result.booking, ...current.filter((item) => item.request_id !== result.booking.request_id)]);
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : "Manual event was not saved.");
    } finally { setManualBusy(false); }
  };

  const updateDraftWindow = (field: "day" | "from_period" | "to_period", value: string | number) => {
    const current = draft?.windows?.[0] || { day: "", from_period: 1, to_period: 13 };
    const window = { ...current, [field]: value };
    if (field === "from_period" && Number(window.to_period) < Number(value)) window.to_period = value as number;
    setDraft({ ...draft, windows: [window] });
  };

  const approved = bookings.filter((b) => b.status === "approved").length;
  const alt = bookings.filter(
    (b) => b.status === "alternative_offered"
  ).length;
  const rejected = bookings.filter((b) => b.status === "rejected").length;

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        (b.request_id || "").toLowerCase().includes(q) ||
        (b.title || "").toLowerCase().includes(q) ||
        (b.requester || "").toLowerCase().includes(q) ||
        (b.room_id || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const categoryColor = (cat: string) => {
    if (cat?.includes("institute")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (cat?.includes("guest")) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    if (cat?.includes("department")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-slate-300 bg-surface-muted border-surface-border";
  };

  return (
    <AppShell>
      <PageHeader
        title={role === "club_representative" ? "My Club Venue Requests" : "Venue Bookings & Spectra Event Management"}
        description={role === "club_representative" ? "Status and decision reasons for requests submitted by your club." : "Priority-ordered booking evaluation, clash-free venue allocation, and alternative slot optimization"}
        badge={role === "club_representative" ? undefined : "Spectra Festival 2027 — 25 Requests"}
      />

      {actionMsg && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>{actionMsg}</span>
          </div>
          <button
            onClick={() => setActionMsg("")}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {canRequest && (
        <Card className="mb-6">
          <CardHeader className="pb-3 border-b border-surface-border/50">
            <CardTitle className="text-sm">Request a venue in English or Hinglish</CardTitle>
            <p className="text-xs text-slate-400">We prepare a structured draft; review and edit it before submitting.</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} rows={3} placeholder="Example: Bhai Friday 2 baje seminar hall chahiye for 40 log, projector ke saath" className="w-full rounded-lg border border-surface-border bg-surface-muted p-3 text-xs text-slate-200" />
            <Button size="sm" onClick={handleParseRequest} disabled={requestBusy || requestText.trim().length < 8}>{requestBusy ? "Preparing…" : "Prepare draft"}</Button>
            {draft && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-lg border border-surface-border p-3">
                <label className="text-xs text-slate-400">Event title<input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
                <label className="text-xs text-slate-400">Attendance<input type="number" min="1" value={draft.attendance ?? ""} onChange={(e) => setDraft({ ...draft, attendance: e.target.value ? Number(e.target.value) : null })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
                <label className="text-xs text-slate-400">Duration (periods)<input type="number" min="1" max="13" value={draft.duration_periods || 1} onChange={(e) => setDraft({ ...draft, duration_periods: Number(e.target.value) })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
                <label className="text-xs text-slate-400">Day<select value={draft.windows?.[0]?.day || ""} onChange={(e) => updateDraftWindow("day", e.target.value)} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100"><option value="">Choose day</option>{["MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => <option key={day} value={day}>{day}</option>)}</select></label>
                <label className="text-xs text-slate-400">Available from P<input type="number" min="1" max="13" value={draft.windows?.[0]?.from_period || 1} onChange={(e) => updateDraftWindow("from_period", Number(e.target.value))} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
                <label className="text-xs text-slate-400">Available through P<input type="number" min="1" max="13" value={draft.windows?.[0]?.to_period || 13} onChange={(e) => updateDraftWindow("to_period", Number(e.target.value))} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
                <label className="text-xs text-slate-400">Venue type<select value={draft.room_types?.[0] || ""} onChange={(e) => setDraft({ ...draft, room_types: e.target.value ? [e.target.value] : [] })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100"><option value="">Choose type</option>{["auditorium", "seminar_hall", "lecture_hall", "classroom", "lab_cs"].map(type => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select></label>
                <label className="text-xs text-slate-400">Needs (comma separated)<input value={(draft.needs || []).join(", ")} onChange={(e) => setDraft({ ...draft, needs: e.target.value.split(",").map((v: string) => v.trim()).filter(Boolean) })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
                <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3"><Button size="sm" onClick={handleSubmitRequest} disabled={requestBusy}>{requestBusy ? "Submitting…" : "Submit reviewed request"}</Button><button onClick={() => setDraft(null)} className="text-xs text-slate-400">Discard draft</button></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {role === "super_admin" || role === "venue_manager" ? (
        <Card className="mb-6 border-cyan-500/20">
          <CardHeader className="pb-3 border-b border-surface-border/50"><CardTitle className="text-sm">Manually schedule an event</CardTitle><p className="text-xs text-slate-400">The server checks room type, capacity, timetable clashes, unavailable rooms, and priority before saving.</p></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-slate-400">Event title<input value={manualEvent.title} onChange={(e) => setManualEvent({ ...manualEvent, title: e.target.value })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
            <label className="text-xs text-slate-400">Attendance<input type="number" min="1" value={manualEvent.attendance} onChange={(e) => setManualEvent({ ...manualEvent, attendance: Number(e.target.value) })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
            <label className="text-xs text-slate-400">Duration (periods)<input type="number" min="1" max="13" value={manualEvent.duration_periods} onChange={(e) => setManualEvent({ ...manualEvent, duration_periods: Number(e.target.value) })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
            <label className="text-xs text-slate-400">Day<select value={manualEvent.day} onChange={(e) => setManualEvent({ ...manualEvent, day: e.target.value })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100">{["MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => <option key={day}>{day}</option>)}</select></label>
            <label className="text-xs text-slate-400">Start period<input type="number" min="1" max="13" value={manualEvent.start_period} onChange={(e) => setManualEvent({ ...manualEvent, start_period: Number(e.target.value) })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
            <label className="text-xs text-slate-400">Room<select value={manualEvent.room_id} onChange={(e) => setManualEvent({ ...manualEvent, room_id: e.target.value })} className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100">{rooms.map(room => <option key={room.id} value={room.id}>{room.id} · {room.name} ({room.capacity})</option>)}</select></label>
            <label className="text-xs text-slate-400 sm:col-span-2">Decision reason<input value={manualEvent.reason} onChange={(e) => setManualEvent({ ...manualEvent, reason: e.target.value })} placeholder="Required reason for audit" className="mt-1 h-9 w-full rounded border border-surface-border bg-surface-muted px-2 text-slate-100" /></label>
            <div className="flex items-end"><Button size="sm" onClick={handleManualSchedule} disabled={manualBusy || !manualEvent.title || manualEvent.reason.trim().length < 8 || !manualEvent.room_id}>{manualBusy ? "Checking…" : "Validate and schedule"}</Button></div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={role === "club_representative" ? "My Club Requests" : "Spectra Requests"}
          value={`${bookings.length} Requests`}
          subtext="Evaluated by role-category priority"
          icon={<DoorClosed className="w-4 h-4" />}
        />
        <StatCard
          label="Directly Approved"
          value={`${approved} Venues`}
          subtext="100% clash-free inside windows"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Alternative Offered"
          value={`${alt} Shifted`}
          subtext="P10–P13 evening slots"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
        {role !== "club_representative" && (
          <StatCard
            label="Booking Score"
            value={`${bookingScore} / 100`}
            subtext="Official validator benchmark"
            icon={<CheckCircle2 className="w-4 h-4 text-cyan-400" />}
          />
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DoorClosed className="w-4 h-4 text-blue-400" />
            {role === "club_representative" ? "My Club Requests" : "Spectra Event Bookings Registry"} ({filtered.length} matching)
            {canApprove && (
              <Badge variant="cyan" className="text-[10px] ml-2">
                Approver
              </Badge>
            )}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search request ID, event, venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-md border border-surface-border bg-surface-muted text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
              />
            </div>

            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-surface-border text-xs">
              {[
                { key: "all", label: `All (${bookings.length})`, color: "blue" },
                { key: "approved", label: `Approved (${approved})`, color: "emerald" },
                { key: "alternative_offered", label: `Alt (${alt})`, color: "amber" },
                { key: "rejected", label: `Rejected (${rejected})`, color: "rose" },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    statusFilter === key
                      ? `bg-${color}-600 text-white`
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs">Loading venue bookings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No booking requests matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Request & Event</th>
                    <th className="py-2.5 px-3">Requester & Role</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">Allocated Slot</th>
                    <th className="py-2.5 px-3">Venue</th>
                    <th className="py-2.5 px-3">Status</th>
                    {canApprove && (
                      <th className="py-2.5 px-3">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {filtered.map((b) => (
                    <tr
                      key={b.request_id}
                      className="hover:bg-surface-elevated/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100 max-w-xs truncate">
                          {b.title}
                        </div>
                        <div className="text-[10px] text-blue-400 font-mono">
                          {b.request_id}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.requester}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {(b.role || "").replace("_", " ")}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] capitalize font-medium border ${categoryColor(
                            b.category || b.requested_category || ""
                          )}`}
                        >
                          {(b.category || b.requested_category || "club_event").replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {b.attendance} people
                      </td>
                      <td className="py-3 px-3">
                        {b.day ? (
                          <div className="font-medium text-slate-200">
                            {b.day} P{b.start_period}
                            {b.end_period !== b.start_period
                              ? `–P${b.end_period}`
                              : ""}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {b.room_id ? (
                          <span className="font-semibold text-emerald-400 font-mono">
                            {b.room_id}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {b.status === "approved" ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                            Approved
                          </span>
                        ) : b.status === "alternative_offered" ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                            Alt. Slot
                          </span>
                        ) : b.status === "rejected" ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/20">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 text-[10px] font-semibold border border-slate-500/20">
                            Pending
                          </span>
                        )}
                        {b.reason && <div className="mt-1 max-w-48 text-[10px] text-slate-400" title={b.reason}>{b.reason}</div>}
                      </td>
                      {canApprove && (
                        <td className="py-3 px-3">
                          <div className="min-w-56 space-y-2">
                            <input aria-label={`Decision reason for ${b.request_id}`} placeholder="Required decision reason" value={decisionInputs[b.request_id]?.reason || ""} onChange={(e) => setDecisionInputs((prev) => ({ ...prev, [b.request_id]: { ...(prev[b.request_id] || { day: b.day || "", period: String(b.start_period || ""), room: b.room_id || "" }), reason: e.target.value } }))} className="h-8 w-full rounded border border-surface-border bg-surface-muted px-2 text-[10px] text-slate-100" />
                            <div className="flex gap-1">
                              <select aria-label="Decision day" value={decisionInputs[b.request_id]?.day || b.day || ""} onChange={(e) => setDecisionInputs((prev) => ({ ...prev, [b.request_id]: { ...(prev[b.request_id] || { reason: "", period: String(b.start_period || ""), room: b.room_id || "" }), day: e.target.value } }))} className="h-7 rounded border border-surface-border bg-surface-muted px-1 text-[10px] text-slate-100">{["MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => <option key={day} value={day}>{day}</option>)}</select>
                              <input aria-label="Decision period" type="number" min="1" max="13" placeholder="P" value={decisionInputs[b.request_id]?.period || b.start_period || ""} onChange={(e) => setDecisionInputs((prev) => ({ ...prev, [b.request_id]: { ...(prev[b.request_id] || { reason: "", day: b.day || "", room: b.room_id || "" }), period: e.target.value } }))} className="h-7 w-12 rounded border border-surface-border bg-surface-muted px-1 text-[10px] text-slate-100" />
                              <input aria-label="Decision room" placeholder="Room ID" value={decisionInputs[b.request_id]?.room || b.room_id || ""} onChange={(e) => setDecisionInputs((prev) => ({ ...prev, [b.request_id]: { ...(prev[b.request_id] || { reason: "", day: b.day || "", period: String(b.start_period || "") }), room: e.target.value } }))} className="h-7 w-20 rounded border border-surface-border bg-surface-muted px-1 text-[10px] text-slate-100" />
                            </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDecision(b.request_id, "approve", b)}
                              disabled={
                                actioning === b.request_id ||
                                b.status === "approved"
                              }
                              title="Approve booking"
                              className="p-1.5 rounded-md hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-emerald-500/20"
                            >
                              {actioning === b.request_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ThumbsUp className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDecision(b.request_id, "reject", b)}
                              disabled={
                                actioning === b.request_id ||
                                b.status === "rejected"
                              }
                              title="Reject booking"
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-rose-500/20"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDecision(b.request_id, "alternative", b)} disabled={actioning === b.request_id} className="rounded border border-amber-500/20 px-2 py-1 text-[10px] text-amber-300 disabled:opacity-30">Offer alternative</button>
                          </div>
                          </div>
                        </td>
                      )}
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
