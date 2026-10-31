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

  const canApprove = role ? PERMISSIONS.canApproveBookings(role) : false;

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await fetchBackend("/bookings/");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
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
    action: "approve" | "reject"
  ) => {
    try {
      setActioning(requestId);
      const endpoint = action === "approve" ? "/bookings/approve" : "/bookings/reject";
      const res = await fetchBackend(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(
          `${requestId} has been ${action === "approve" ? "approved" : "rejected"} successfully.`
        );
        // Optimistically update UI
        setBookings((prev) =>
          prev.map((b) =>
            b.request_id === requestId
              ? { ...b, status: action === "approve" ? "approved" : "rejected" }
              : b
          )
        );
      } else {
        setActionMsg(data.message || "Action failed.");
      }
    } catch {
      setActionMsg("Network error performing action.");
    } finally {
      setActioning(null);
    }
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
        title="Venue Bookings & Spectra Event Management"
        description="Priority-ordered booking evaluation, clash-free venue allocation, and alternative slot optimization"
        badge="Spectra Festival 2027 — 25 Requests"
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Spectra Requests"
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
        <StatCard
          label="Booking Score"
          value={`${bookingScore} / 100`}
          subtext="Official validator benchmark"
          icon={<CheckCircle2 className="w-4 h-4 text-cyan-400" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DoorClosed className="w-4 h-4 text-blue-400" />
            Spectra Event Bookings Registry ({filtered.length} matching)
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
                      </td>
                      {canApprove && (
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleDecision(b.request_id, "approve")
                              }
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
                              onClick={() =>
                                handleDecision(b.request_id, "reject")
                              }
                              disabled={
                                actioning === b.request_id ||
                                b.status === "rejected"
                              }
                              title="Reject booking"
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-rose-500/20"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
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
