"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Filter, Sparkles, Download, Layers } from "lucide-react";

export default function TimetablePage() {
  const [activeView, setActiveView] = useState<"group" | "faculty" | "room">("group");
  const [selectedDay, setSelectedDay] = useState("Monday");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "08:30 - 09:30",
    "09:30 - 10:30",
    "10:30 - 11:30",
    "11:30 - 12:30",
    "12:30 - 01:30",
    "01:30 - 02:30",
    "02:30 - 03:30",
    "03:30 - 04:30",
  ];

  return (
    <AppShell>
      <PageHeader
        title="Weekly Timetable Matrix"
        description="Comprehensive clash-free master schedule for 14 student cohorts and 40 faculty members"
        badge="Zero Conflicts Target"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Download JSON / CSV
            </Button>
            <Button variant="primary" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate via CP-SAT
            </Button>
          </>
        }
      />

      {/* Filter and View Selector Ribbon */}
      <Card className="p-3 bg-surface/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Toggles */}
          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-lg border border-surface-border">
            <button
              onClick={() => setActiveView("group")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeView === "group" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              By Student Group (14)
            </button>
            <button
              onClick={() => setActiveView("faculty")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeView === "faculty" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              By Faculty (40)
            </button>
            <button
              onClick={() => setActiveView("room")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeView === "room" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              By Room / Lab (27)
            </button>
          </div>

          {/* Days Ribbon */}
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-surface-border">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedDay === day ? "bg-surface-elevated text-blue-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Grid Matrix Shell */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-surface-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Active Schedule View: {selectedDay} ({activeView.toUpperCase()})
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Awaiting Ingestion
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-blue-400" />}
            title="Timetable Grid Awaiting Official Course Sessions"
            description="The 189 course sessions and room assignments will render here upon running the CP-SAT solver against cit_public.json."
            expectedDatasetNote="189 sessions / 243 teaching hours to schedule across 27 rooms"
            action={
              <Button variant="primary" size="sm">
                Run Solver Validation
              </Button>
            }
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
