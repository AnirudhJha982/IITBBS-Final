"use client";

import React from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Sliders, CheckCircle2, AlertTriangle, ShieldCheck, Plus } from "lucide-react";

export default function ManualSchedulingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Manual Scheduling & Constraint Validation"
        description="Fine-grained manual slotting with instant hard-constraint conflict checking"
        badge="Live Validation"
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Manual Slot
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Hard Constraints</p>
              <p className="text-[11px] text-slate-400">Zero room, faculty, or cohort overlap</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-semibold text-blue-400">Capacity Fit</p>
              <p className="text-[11px] text-slate-400">Room size must satisfy group strength</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-400">Soft Preferences</p>
              <p className="text-[11px] text-slate-400">Minimized gaps & balanced daily load</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Session Allocation Workbench</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Sliders className="w-8 h-8 text-blue-400" />}
            title="Manual Scheduling Workbench Ready"
            description="Allows administrators to manually assign or adjust specific sessions while running instant conflict checks against the remaining 188 sessions."
            expectedDatasetNote="Requires master session registry from cit_public.json"
            action={
              <Button variant="secondary" size="sm">
                Validate Current Configuration
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
