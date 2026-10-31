import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, subtext, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden border-surface-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          {icon && <div className="text-slate-400 p-2 rounded-lg bg-surface-muted/50">{icon}</div>}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded",
                trend.isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
