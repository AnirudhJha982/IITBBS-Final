"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DoorClosed, CheckCircle2, Clock, AlertTriangle, Plus, Sparkles } from "lucide-react";

export default function VenueBookingsPage() {
  const [filter, setFilter] = useState<"all" | "spectra" | "adhoc">("all");

  return (
    <AppShell>
      <PageHeader
        title="Venue Bookings & Spectra Event Management"
        description="Smart booking approval, conflict resolution, and automated alternative venue suggestions"
        badge="Spectra Festival"
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Booking Request
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Spectra Requests"
          value="25 Official"
          subtext="High-priority cultural & tech events"
          icon={<DoorClosed className="w-4 h-4" />}
        />
        <StatCard
          label="Approved Venues"
          value="0"
          subtext="Conflict-free slots approved"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Alternative Suggestions"
          value="Pending"
          subtext="Automated alternative room engine"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold">Venue Booking Requests Registry</CardTitle>
          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-lg border border-surface-border">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                filter === "all" ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setFilter("spectra")}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                filter === "spectra" ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              Spectra (25)
            </button>
            <button
              onClick={() => setFilter("adhoc")}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                filter === "adhoc" ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              Ad-hoc
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <EmptyState
            icon={<DoorClosed className="w-8 h-8 text-blue-400" />}
            title="Awaiting Official Spectra Booking Requests"
            description="The 25 official Spectra event booking requests will load here for conflict evaluation against the academic master timetable."
            expectedDatasetNote="25 Spectra booking requests in official starter pack"
            action={
              <Button variant="primary" size="sm">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Evaluate Booking Requests
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
