"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BarChart3, TrendingUp, PieChart, Activity, Download } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Campus Analytics & Utilization Reporting"
        description="Data-driven intelligence on venue utilization, teaching loads, and student timetable efficiency"
        badge="Zero Hallucinated Metrics"
        actions={
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            Export Utilization Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Venue Utilization"
          value="Awaiting Schedule"
          subtext="Computed from 27 room allocations"
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <StatCard
          label="Weekly Contact Hours"
          value="243 Target"
          subtext="Total curricular teaching load"
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          label="Student Idle Gaps"
          value="Pending Solver"
          subtext="Target: < 1.0 hour/day avg"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Soft Penalty Score"
          value="Pending Run"
          subtext="Calculated via CP-SAT objective"
          icon={<PieChart className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campus Utilization Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
            title="Analytics Engine Ready for Computation"
            description="Institutional metrics and heatmaps will compute deterministically once the official schedule is generated from cit_public.json."
            expectedDatasetNote="Metrics will reflect exact data: 27 rooms, 40 faculty, 189 sessions"
            action={
              <Button variant="primary" size="sm">
                Compute Schedule Analytics
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
