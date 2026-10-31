"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { DoorClosed, CheckCircle2, AlertTriangle, XCircle, Search, Loader2 } from "lucide-react";

export default function VenueBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [bookingScore, setBookingScore] = useState(66.0);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const res = await fetchBackend("/bookings/");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
          if (data.booking_score) setBookingScore(data.booking_score);
        }
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const approved = bookings.filter((b) => b.status === "approved").length;
  const alt = bookings.filter((b) => b.status === "alternative_offered").length;
  const rejected = bookings.filter((b) => b.status === "rejected").length;

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        b.request_id.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.requester.toLowerCase().includes(q) ||
        (b.room_id && b.room_id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <AppShell>
      <PageHeader
        title="Venue Bookings & Spectra Event Management"
        description="Priority-ordered booking evaluation, clash-free venue allocation, and alternative slot optimization"
        badge="Spectra Festival 2027 — 25 Requests"
      />

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
          subtext="P10-P13 evening slots"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Weighted Booking Score"
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
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({bookings.length})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === "approved" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Approved ({approved})
              </button>
              <button
                onClick={() => setStatusFilter("alternative_offered")}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === "alternative_offered" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Alternative ({alt})
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === "rejected" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Rejected ({rejected})
              </button>
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
                    <th className="py-2.5 px-3">Request ID & Event Title</th>
                    <th className="py-2.5 px-3">Requester & Role</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">Allocated Slot</th>
                    <th className="py-2.5 px-3">Venue</th>
                    <th className="py-2.5 px-3">Decision Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-xs text-slate-300">
                  {filtered.map((b) => (
                    <tr key={b.request_id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">{b.title}</div>
                        <div className="text-[10px] text-blue-400 font-mono">{b.request_id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.requester}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{b.role.replace("_", " ")}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] capitalize bg-surface-muted text-slate-300 border border-surface-border font-medium">
                          {b.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {b.attendance} people
                      </td>
                      <td className="py-3 px-3">
                        {b.day ? (
                          <div className="font-medium text-slate-200">
                            {b.day} P{b.start_period}{b.end_period !== b.start_period ? `-P${b.end_period}` : ""}
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
                            Alternative Slot
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/20">
                            Rejected
                          </span>
                        )}
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
