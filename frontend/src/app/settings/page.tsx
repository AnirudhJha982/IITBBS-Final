"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Settings, Cpu, Bot, Shield, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <PageHeader
        title="System Settings & Solver Parameters"
        description="Configure CP-SAT solver limits, AI model providers, and institutional parameters"
        badge="Platform v1.0.0"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solver Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-blue-400" />
              <div>
                <CardTitle>Google OR-Tools CP-SAT Solver</CardTitle>
                <CardDescription>Mathematical optimization limits</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Maximum Solve Time (Seconds)
              </label>
              <Input defaultValue="120" type="number" />
              <p className="text-[11px] text-slate-400 mt-1">Recommended 60-180s for 189 sessions</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Parallel Worker Threads
              </label>
              <Input defaultValue="8" type="number" />
              <p className="text-[11px] text-slate-400 mt-1">Utilizes available CPU multithreading</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Provider Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-cyan-400" />
              <div>
                <CardTitle>AI Provider Abstraction</CardTitle>
                <CardDescription>Natural language and Hinglish parsing provider</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Active Provider
              </label>
              <select className="w-full h-9 rounded-lg border border-surface-border bg-surface-muted px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="mock">Mock Deterministic Provider (Offline / Safe)</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="gemini">Google Gemini 1.5 Pro</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Model Name
              </label>
              <Input defaultValue="gpt-4o" />
            </div>
          </CardContent>
        </Card>

        {/* Institutional Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <CardTitle>Institutional Details</CardTitle>
                <CardDescription>Campus identity and regulatory profile</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Institution Name
                </label>
                <Input defaultValue={process.env.NEXT_PUBLIC_CAMPUS_NAME || "Chitkara Institute of Technology"} readOnly />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Backend API Base URL
                </label>
                <Input defaultValue={process.env.NEXT_PUBLIC_API_URL || "/api/v1"} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-4 border-t border-surface-border/50">
            <Button variant="primary" size="sm" onClick={handleSave}>
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-emerald-300" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
