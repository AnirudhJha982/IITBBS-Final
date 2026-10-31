"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { GraduationCap, Calendar, Users, ShieldAlert, Sparkles, Download } from "lucide-react";

export default function ExaminationsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Midsemester Examination Scheduling"
        description="Conflict-free examination slotting, invigilator duty allocations, and room capacity enforcement"
        badge="Midsem 2026"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Export Exam Roster
            </Button>
            <Button variant="primary" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Schedule Examinations
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Midsem Exams"
          value="41 Exams"
          subtext="Target examinations in starter pack"
          icon={<GraduationCap className="w-4 h-4" />}
        />
        <StatCard
          label="Examination Slots"
          value="Unassigned"
          subtext="Morning & afternoon sessions"
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Faculty Invigilators"
          value="40 Required"
          subtext="Single invigilation constraint"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Midsemester Exam Schedule Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<GraduationCap className="w-8 h-8 text-blue-400" />}
            title="Midsem Examination Data Awaiting Ingestion"
            description="The 41 midsemester exams will be scheduled across eligible halls without student or invigilator overlaps once official exam requirements are loaded."
            expectedDatasetNote="41 midsem examination slots to schedule with invigilation duties"
            action={
              <Button variant="primary" size="sm">
                Import Examination Roster
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
