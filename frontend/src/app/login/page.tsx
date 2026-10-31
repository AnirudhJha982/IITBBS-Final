"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("coordinator@chitkara.edu.in");
  const [password, setPassword] = useState("••••••••••••");
  const [selectedRole, setSelectedRole] = useState("timetable_coordinator");

  const roles = [
    { id: "timetable_coordinator", name: "Timetable Coordinator", badge: "Primary Actor" },
    { id: "academic_dean", name: "Academic Dean", badge: "Approver" },
    { id: "faculty", name: "Faculty Member", badge: "Instructor" },
    { id: "venue_manager", name: "Venue Manager", badge: "Spectra" },
    { id: "student_representative", name: "Student Rep", badge: "Viewer" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-glow">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CampusOS AI</h1>
          <p className="text-xs text-slate-400">
            Intelligent Campus Scheduling Platform · Chitkara Institute of Technology
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In to Campus Portal</CardTitle>
            <CardDescription>
              Select your academic role or enter your institutional credentials
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* Quick Role Selection for Hackathon Reviewers */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Simulate Role Access (RBAC)
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => {
                        setSelectedRole(r.id);
                        setEmail(`${r.id}@chitkara.edu.in`);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        selectedRole === r.id
                          ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                          : "bg-surface-muted/50 border-surface-border text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>{r.name}</span>
                      <Badge variant={selectedRole === r.id ? "secondary" : "outline"} className="text-[10px]">
                        {r.badge}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button variant="primary" size="md" className="w-full text-xs" type="submit">
                Access Platform
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security Footer Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control Enforced</span>
        </div>
      </div>
    </div>
  );
}
