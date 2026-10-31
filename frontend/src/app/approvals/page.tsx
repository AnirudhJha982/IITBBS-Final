"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CheckSquare, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export default function ApprovalsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Administrative Approvals & Governance"
        description="Role-based sign-off for timetable publication, venue reservations, and emergency rescheduling"
        badge="Academic Dean & Coordinator Gate"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Approvals"
          value="0"
          subtext="No outstanding administrative sign-offs"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Approved This Cycle"
          value="0"
          subtext="Verified and signed requests"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Governance Status"
          value="Synchronized"
          subtext="All actions logged to audit trail"
          icon={<ShieldCheck className="w-4 h-4 text-blue-400" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Governance Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<CheckSquare className="w-8 h-8 text-blue-400" />}
            title="Approvals Queue is Clear"
            description="When timetable changes, venue bookings, or rescheduling actions require dean or coordinator approval, requests will appear here."
            expectedDatasetNote="Supports role-based authorization for Academic Dean and Timetable Coordinator"
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
