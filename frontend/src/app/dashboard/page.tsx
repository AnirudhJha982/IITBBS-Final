"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  Calendar,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Campus Operations & Scheduling Dashboard"
        description="Chitkara Institute of Technology — Unified Academic Timetable & Venue Control Center"
        badge="Academic Year 2026-27"
        actions={
          <>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Schedule
            </Button>
            <Button variant="primary" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate Timetable
            </Button>
          </>
        }
      />

      {/* Target Dataset Metric Indicators (Spec Foundations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Campus Venues"
          value="27 Rooms"
          subtext="Lecture halls, labs & seminar halls"
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          label="Faculty Members"
          value="40 Faculty"
          subtext="Allocated across academic depts"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Weekly Contact Hours"
          value="243 Hours"
          subtext="Across 189 weekly course sessions"
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Midsem Exams"
          value="41 Slots"
          subtext="Awaiting examination schedule"
          icon={<GraduationCap className="w-4 h-4" />}
        />
      </div>

      {/* Architectural Readiness & Activity Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Official Timetable Status</CardTitle>
            <CardDescription>
              Real-time clash detection status powered by Google OR-Tools CP-SAT and validator.py
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-blue-400" />}
              title="No Generated Timetable in Active Memory"
              description="The scheduling engine is primed. Provide the official dataset in data/official/ to trigger automated clash-free timetable generation."
              expectedDatasetNote="Requires cit_public.json (189 sessions, 14 student groups, 62 courses)"
              action={
                <Button variant="primary" size="sm">
                  View Timetable Matrix
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Quick System Diagnostics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Diagnostics</CardTitle>
              <CardDescription>Engine and constraint validation status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Constraint Engine</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-200">AI Assistant (Hinglish)</span>
                </div>
                <span className="text-[11px] font-semibold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                  Armed
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-200">Disruption Rescheduler</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10">
                  Standby
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
