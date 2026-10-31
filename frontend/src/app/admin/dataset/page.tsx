"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { fetchBackend } from "@/lib/api";
import { ArrowLeft, Download, FileUp, Loader2 } from "lucide-react";

export default function DatasetAdminPage() {
  const { role } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadSummary = async () => {
    try {
      const response = await fetchBackend("/dataset/");
      const result = await response.json();
      if (response.ok) setSummary(result);
      else setMessage(result.message || "Could not load dataset details.");
    } catch { setMessage("Dataset service is unavailable."); }
  };

  useEffect(() => { if (role === "super_admin") void loadSummary(); }, [role]);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setMessage("Checking the file against the starter-pack schema…");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetchBackend("/dataset/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const detail = result.message;
        throw new Error(typeof detail === "string" ? detail : [detail?.message, ...(detail?.errors || [])].filter(Boolean).join(" "));
      }
      setMessage(result.message);
      setFile(null);
      await loadSummary();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dataset was not saved.");
    } finally { setBusy(false); }
  };

  const download = async () => {
    const response = await fetchBackend("/dataset/export");
    if (!response.ok) { setMessage("Dataset export failed."); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "cit_public.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (role !== "super_admin") return <AppShell><Card><CardContent className="p-8 text-center text-sm text-slate-300">Only a Super Admin may edit the official dataset.</CardContent></Card></AppShell>;

  return <AppShell>
    <PageHeader title="Official Dataset" description="Download, edit, validate, and upload JSON in the starter-pack format." badge="Admin only" actions={<Link href="/dashboard"><Button variant="outline" size="sm"><ArrowLeft className="mr-1.5 h-4 w-4" />Dashboard</Button></Link>} />
    {message && <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-100">{message}</div>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Current dataset</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {summary ? <><p className="text-xs text-slate-300">ID: <span className="font-mono text-blue-300">{summary.dataset_id}</span></p><div className="grid grid-cols-2 gap-2 text-xs">{Object.entries(summary.counts || {}).map(([key, value]) => <div key={key} className="rounded border border-surface-border bg-surface-muted p-2 text-slate-300">{key.replaceAll("_", " ")}: <b className="text-white">{String(value)}</b></div>)}</div><p className="text-[11px] text-slate-500">Last upload: {summary.last_uploaded_at || "checked-in starter dataset"}</p></> : <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
          <Button size="sm" variant="outline" onClick={download}><Download className="mr-1.5 h-4 w-4" />Download JSON to edit</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Upload revised dataset</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-400">The backend checks the JSON structure and references before saving. Uploading changes the source dataset; it does not silently modify the active timetable.</p>
          <input type="file" accept=".json,application/json" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:text-white" />
          {file && <p className="text-xs text-slate-300">Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
          <Button size="sm" onClick={upload} disabled={!file || busy}><FileUp className="mr-1.5 h-4 w-4" />{busy ? "Validating…" : "Validate and save dataset"}</Button>
        </CardContent>
      </Card>
    </div>
  </AppShell>;
}
