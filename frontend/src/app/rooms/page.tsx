"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Building2, Layers, Cpu, CheckCircle2, Upload } from "lucide-react";

export default function RoomsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Campus Venues & Rooms Directory"
        description="Physical capacity, equipment profiles, and block allocation for all 27 campus venues"
        badge="27 Total Venues"
        actions={
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-1.5" />
            Import Rooms CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Venues"
          value="27 Rooms"
          subtext="Official Chitkara dataset target"
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          label="Lecture Halls"
          value="Standard"
          subtext="High-capacity classrooms"
          icon={<Layers className="w-4 h-4" />}
        />
        <StatCard
          label="Computer Labs"
          value="Specialized"
          subtext="Hands-on computing facilities"
          icon={<Cpu className="w-4 h-4" />}
        />
        <StatCard
          label="Utilization Rate"
          value="Calculated Post-Solve"
          subtext="Weekly occupancy metric"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campus Venues Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-blue-400" />}
            title="Awaiting Official Room Dataset"
            description="The 27 campus venues with their capacities, equipment features, and blocks will populate here from cit_public.json and CSV sources."
            expectedDatasetNote="Expected 27 rooms in official starter pack"
            action={
              <Button variant="primary" size="sm">
                View Room Schema Specification
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
