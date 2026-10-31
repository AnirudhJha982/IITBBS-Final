"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { RefreshCw, AlertOctagon, TrendingDown, ArrowRight, ShieldCheck } from "lucide-react";

export default function ReschedulingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Timetable Disruption & Rescheduling Engine"
        description="Dynamic recovery from room maintenance closures and faculty emergency leave with minimal campus disruption"
        badge="Zero Cascading Clashes"
        actions={
          <Button variant="danger" size="sm">
            <AlertOctagon className="w-4 h-4 mr-1.5" />
            Simulate Disruption
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Disruptions"
          value="0 Active"
          subtext="No room or faculty outages logged"
          icon={<AlertOctagon className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Displacement Impact"
          value="0.0"
          subtext="L1 distance displacement metric"
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <StatCard
          label="Rescheduled Sessions"
          value="0"
          subtext="Relocated or reassigned slots"
          icon={<RefreshCw className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disruption Scenarios & Recovery Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<RefreshCw className="w-8 h-8 text-blue-400" />}
            title="Awaiting sample_disruption.json Ingestion"
            description="When faculty emergency absences or room closures occur, minimal-displacement shift proposals will be generated here."
            expectedDatasetNote="Ready for sample_disruption.json evaluation from starter pack"
            action={
              <Button variant="primary" size="sm">
                Load Sample Disruption
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
