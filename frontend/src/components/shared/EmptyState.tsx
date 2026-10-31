import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Database, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  expectedDatasetNote?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  expectedDatasetNote = "Awaiting official dataset ingestion in data/official/",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-surface-border bg-surface/30 backdrop-blur-sm max-w-2xl mx-auto my-6">
      <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border text-blue-400 mb-4 shadow-sm">
        {icon || <Database className="w-8 h-8 text-blue-400" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-5 leading-relaxed">{description}</p>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted/60 border border-surface-border text-xs text-slate-400 mb-6">
        <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
        <span>{expectedDatasetNote}</span>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
