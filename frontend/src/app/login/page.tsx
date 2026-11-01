"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";

const DEMO_ACCOUNTS = [
  {
    id: "timetable_coordinator",
    label: "Timetable Coordinator",
    badge: "Primary Actor",
    email: "coordinator@chitkara.edu.in",
    password: "Coord@2026",
  },
  {
    id: "academic_dean",
    label: "Academic Dean",
    badge: "Approver",
    email: "dean@chitkara.edu.in",
    password: "Dean@2026",
  },
  {
    id: "department_coordinator",
    label: "Department Coordinator",
    badge: "Department",
    email: "dept.coordinator@chitkara.edu.in",
    password: "DeptCoord@2026",
  },
  {
    id: "venue_manager",
    label: "Venue Manager",
    badge: "Spectra",
    email: "venues@chitkara.edu.in",
    password: "Venue@2026",
  },
  {
    id: "faculty",
    label: "Faculty Member",
    badge: "Instructor",
    email: "faculty@chitkara.edu.in",
    password: "Faculty@2026",
  },
  {
    id: "student_representative",
    label: "Student Rep",
    badge: "Viewer",
    email: "student@chitkara.edu.in",
    password: "Student@2026",
  },
  {
    id: "club_representative",
    label: "Club Representative",
    badge: "Club Requests",
    email: "club@chitkara.edu.in",
    password: "Club@2026",
  },
  {
    id: "super_admin",
    label: "Super Admin",
    badge: "Admin",
    email: "admin@chitkara.edu.in",
    password: "Admin@2026",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  const [email, setEmail] = useState("coordinator@chitkara.edu.in");
  const [password, setPassword] = useState("Coord@2026");
  const [selectedRole, setSelectedRole] = useState("timetable_coordinator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const next = searchParams.get("next") || "/dashboard";
      router.replace(next);
    }
  }, [user, router, searchParams]);

  const handleDemoSelect = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setSelectedRole(account.id);
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }

      // Refresh auth context then navigate
      await refresh();
      const next = searchParams.get("next") || data.redirectTo || "/dashboard";
      router.push(next);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Sign In to Campus Portal</CardTitle>
        <CardDescription>
          Select a demo role or enter your institutional credentials
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {/* Demo Role Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Quick Demo Access (RBAC Simulation)
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => handleDemoSelect(acc)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                    selectedRole === acc.id
                      ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                      : "bg-surface-muted/50 border-surface-border text-slate-400 hover:text-slate-200 hover:border-slate-500"
                  }`}
                >
                  <div>
                    <span>{acc.label}</span>
                    <span className="text-[10px] text-slate-500 ml-2 font-mono">
                      {acc.email}
                    </span>
                  </div>
                  <Badge
                    variant={selectedRole === acc.id ? "secondary" : "outline"}
                    className="text-[10px] shrink-0"
                  >
                    {acc.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="pl-9 text-xs"
                placeholder="user@chitkara.edu.in"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="pl-9 text-xs"
                required
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full text-xs"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                Access Platform
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-glow">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            CampusOS AI
          </h1>
          <p className="text-xs text-slate-400">
            Intelligent Campus Scheduling Platform · Chitkara Institute of
            Technology
          </p>
        </div>

        {/* Suspense-wrapped Login Card */}
        <Suspense
          fallback={
            <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
              <p className="text-xs">Loading portal...</p>
            </Card>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control · HMAC-SHA256 Session Tokens</span>
        </div>
      </div>
    </div>
  );
}
