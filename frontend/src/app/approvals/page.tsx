"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { PERMISSIONS } from "@/lib/auth";
import {
  CheckSquare,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  RefreshCw,
  DoorClosed,
} from "lucide-react";

interface ApprovalItem {
  id: string;
  type: "timetable_publication" | "disruption_repair" | "fest_override" | "venue_request";
  title: string;
  submittedBy: string;
  department: string;
  impact: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
}

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "APP-2026-01",
    type: "timetable_publication",
    title: "Official Spring 2026-27 Master Timetable Publication Sign-off",
    submittedBy: "Dr. Priya Sharma (Timetable Coordinator)",
    department: "Academic Affairs",
    impact: "189 sessions, 40 faculty, 27 venues · 0 Hard Violations verified",
    status: "pending",
  },
  {
    id: "APP-2026-02",
    type: "disruption_repair",
    title: "Emergency Schedule Repair Sign-off: Room CR-102 Closure & F07 Leave",
    submittedBy: "Disruption Management Engine",
    department: "Facilities & Operations",
    impact: "Relocates 10 sessions from CR-102 with minimal shift · Penalty 251 pts",
    status: "pending",
  },
  {
    id: "APP-2026-03",
    type: "fest_override",
    title: "Spectra Festival Week Override: Move ID101 to accommodate BR-01",
    submittedBy: "Spectra Core Team (Admin)",
    department: "Student Affairs",
    impact: "Displaces ID101-ALL-L1 in AUD on WED P4 to enable Institute Inauguration",
    status: "pending",
  },
  {
    id: "APP-2026-04",
    type: "venue_request",
    title: "Special Department Seminar: ECE Industry Speaker in SH-1",
    submittedBy: "Dr. Anita Verma (HoD ECE)",
    department: "ECE",
    impact: "Allocates SH-1 on Wednesday P6-P7 for 120 attendees",
    status: "approved",
    reviewedBy: "Academic Dean",
    reviewedAt: "2026-10-31 18:30 IST",
  },
];

export default function ApprovalsPage() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [msg, setMsg] = useState("");

  const canApprove = role ? PERMISSIONS.canViewApprovals(role) : false;

  const handleDecision = (id: string, action: "approved" | "rejected") => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: action,
              reviewedBy: user?.name || "Academic Officer",
              reviewedAt: new Date().toLocaleTimeString(),
            }
          : item
      )
    );
    setMsg(`Request ${id} has been ${action}. Decision recorded in audit log.`);
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const approvedCount = items.filter((i) => i.status === "approved").length;

  return (
    <AppShell>
      <PageHeader
        title="Administrative Approvals & Governance Queue"
        description="Role-based sign-off for master timetable publication, emergency rescheduling, and institute event venue displacements"
        badge="Academic Dean & Coordinator Gate"
      />

      {msg && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Pending Sign-offs"
          value={`${pendingCount} Requests`}
          subtext="Requires Dean / Coordinator review"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Approved This Cycle"
          value={`${approvedCount} Signed`}
          subtext="Verified and signed into effect"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Audit Governance"
          value="Synchronized"
          subtext="All decisions cryptographically signed"
          icon={<ShieldCheck className="w-4 h-4 text-blue-400" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-surface-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            Governance Action Queue ({items.length} items)
          </CardTitle>
          <Badge variant="cyan" className="text-xs">
            RBAC Gate Active
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-surface-muted border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border shrink-0 mt-0.5">
                    {item.type === "timetable_publication" && <Calendar className="w-5 h-5 text-blue-400" />}
                    {item.type === "disruption_repair" && <RefreshCw className="w-5 h-5 text-amber-400" />}
                    {item.type === "fest_override" && <DoorClosed className="w-5 h-5 text-purple-400" />}
                    {item.type === "venue_request" && <Clock className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-100">{item.title}</span>
                      <span className="font-mono text-[10px] text-blue-400">{item.id}</span>
                      <Badge
                        variant={
                          item.status === "approved"
                            ? "success"
                            : item.status === "rejected"
                            ? "outline"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Submitted by: <span className="text-slate-300 font-medium">{item.submittedBy}</span> · {item.department}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Scope & Impact: <span className="text-slate-300">{item.impact}</span>
                    </p>
                    {item.reviewedBy && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        ✓ Reviewed by {item.reviewedBy} at {item.reviewedAt}
                      </p>
                    )}
                  </div>
                </div>

                {canApprove && item.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDecision(item.id, "approved")}
                      className="text-xs"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecision(item.id, "rejected")}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
