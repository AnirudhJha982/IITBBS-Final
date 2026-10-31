"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, GraduationCap, Clock, Award, Upload } from "lucide-react";

export default function FacultyPage() {
  return (
    <AppShell>
      <PageHeader
        title="Faculty Directory & Workload Registry"
        description="Teaching assignments, weekly contact hours, and department affiliations for 40 faculty members"
        badge="40 Faculty Members"
        actions={
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-1.5" />
            Import Faculty CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Faculty"
          value="40 Faculty"
          subtext="Official Chitkara teaching staff"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Course Sessions"
          value="189 Sessions"
          subtext="Total weekly course sections"
          icon={<GraduationCap className="w-4 h-4" />}
        />
        <StatCard
          label="Teaching Contact"
          value="243 Hours"
          subtext="Weekly classroom teaching"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Max Daily Hours"
          value="Hard Constraint"
          subtext="Prevents faculty fatigue"
          icon={<Award className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Users className="w-8 h-8 text-blue-400" />}
            title="Awaiting Official Faculty Dataset"
            description="The 40 official faculty profiles, departmental designations, and maximum weekly load limits will load here from cit_public.json."
            expectedDatasetNote="Expected 40 faculty members in official starter pack"
            action={
              <Button variant="primary" size="sm">
                View Faculty Schema Specification
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
