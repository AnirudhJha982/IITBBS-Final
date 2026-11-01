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
    id: "admin_dean",
    label: "Admin (Dean's office)",
    badge: "Full Control",
    email: "admin@chitkara.edu.in",
    password: "Admin@2026",
    description: "Everything: generates timetable, approves timetable changes & bookings moving classes, changes priority order",
  },
  {
    id: "department_coordinator",
    label: "Department coordinator",
    badge: "Dept Lead",
    email: "dept.coordinator@chitkara.edu.in",
    password: "DeptCoord@2026",
    description: "Requests changes to dept sessions, books rooms for dept events, approves lab bookings",
  },
  {
    id: "faculty",
    label: "Faculty",
    badge: "Instructor",
    email: "faculty@chitkara.edu.in",
    password: "Faculty@2026",
    description: "Views own timetable, marks unavailability, requests extra or moved sessions",
  },
  {
    id: "club_representative",
    label: "Club representative",
    badge: "Club Requests",
    email: "club@chitkara.edu.in",
    password: "Club@2026",
    description: "Submits and cancels venue requests, sees status and reason for decisions",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  const [email, setEmail] = useState("admin@chitkara.edu.in");
  const [password, setPassword] = useState("Admin@2026");
  const [selectedRole, setSelectedRole] = useState("admin_dean");
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
          {/* 4 Official Authorized Roles */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Official Institutional Roles (4 Accounts)
              </label>
              <span className="text-[10px] text-blue-400 font-medium">Click to select</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => handleDemoSelect(acc)}
                  className={`flex flex-col p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                    selectedRole === acc.id
                      ? "bg-blue-600/20 border-blue-500/50 text-blue-200 ring-1 ring-blue-500/30"
                      : "bg-surface-muted/50 border-surface-border text-slate-400 hover:text-slate-200 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{acc.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {acc.email}
                      </span>
                    </div>
                    <Badge
                      variant={selectedRole === acc.id ? "secondary" : "outline"}
                      className="text-[10px] shrink-0"
                    >
                      {acc.badge}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                    {acc.description}
                  </p>
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
