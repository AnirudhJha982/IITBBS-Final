"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Users, GraduationCap, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
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
import { ROLE_HOME, type UserRole } from "@/lib/auth";

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

const ROLE_HOME_FALLBACK = "/dashboard";

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
      const next = searchParams.get("next") || ROLE_HOME[user.role as UserRole] || ROLE_HOME_FALLBACK;
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
      const sessionUser = await refresh();
      if (!sessionUser) {
        setError("Sign-in succeeded, but your session could not be verified. Please try again.");
        return;
      }
      const next = searchParams.get("next") || data.redirectTo || ROLE_HOME[sessionUser.role] || ROLE_HOME_FALLBACK;
      router.replace(next);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-none bg-transparent backdrop-blur-none text-slate-900">
      <CardHeader className="px-0 pt-0 pb-5">
        <CardTitle className="text-2xl md:text-[28px] font-bold tracking-tight text-[#40251f]">Sign in to VetoGrid</CardTitle>
        <CardDescription>
          Select a demo role or enter your institutional credentials.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {/* 4 Official Authorized Roles */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-[#4b3025]">
                Official institutional roles <span className="font-normal text-[#8b735e]">(4 accounts)</span>
              </label>
              <span className="text-[11px] text-[#897613] font-medium">Click to select</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => {
                const RoleIcon = acc.id === "admin_dean" ? ShieldCheck : acc.id === "department_coordinator" ? Building2 : acc.id === "faculty" ? GraduationCap : Users;
                return <button
                  type="button"
                  key={acc.id}
                  onClick={() => handleDemoSelect(acc)}
                  className={`flex flex-col p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                    selectedRole === acc.id
                      ? "bg-[#f5e3dc] border-[#c68b7b] text-[#40251f] ring-1 ring-[#d9aa9b]/50"
                      : "bg-[#fffdf8] border-[#e4d7c8] text-[#5d4637] hover:bg-[#faf3e9] hover:border-[#cbb69c]"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedRole === acc.id ? "bg-[#d9aa9b]/40 text-[#713f32]" : "bg-[#f3eadc] text-[#604532]"}`}>
                      <RoleIcon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#402a20] truncate">{acc.label}</span>
                        <Badge
                          variant={selectedRole === acc.id ? "secondary" : "outline"}
                          className="text-[10px] shrink-0 border-[#e2d4c1] text-[#715b42]"
                        >
                          {acc.badge}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#897361] font-mono block truncate">
                        {acc.email}
                      </span>
                      <p className="mt-0.5 text-[11px] text-[#775f4d] line-clamp-1">
                        {acc.description}
                      </p>
                    </div>
                  </div>
                </button>;
              })}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-[#594332] block mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#88725e] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="pl-9 text-sm h-11 bg-[#fffdf8] border-[#e3d4c2] text-[#40271d] placeholder:text-[#9b8876] focus-visible:ring-[#a39118]"
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
                className="text-[11px] font-medium text-[#897613] hover:text-[#63530e] hover:underline transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#88725e] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="pl-9 text-sm h-11 bg-[#fffdf8] border-[#e3d4c2] text-[#40271d] placeholder:text-[#9b8876] focus-visible:ring-[#a39118]"
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

        <CardFooter className="pt-3 px-0 border-[#e7dccd]">
          <Button
            variant="primary"
            size="md"
            className="w-full h-12 text-sm font-semibold rounded-xl bg-[#9a8715] hover:bg-[#857310] active:bg-[#6f5f0e] text-white shadow-[0_8px_18px_rgba(131,111,13,0.22)]"
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
    <main className="min-h-screen bg-[#f7f2e7] flex items-center justify-center p-3 md:p-8 relative overflow-hidden">
      <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-[#a39118]/20 pointer-events-none" />
      <div className="absolute -bottom-40 -left-36 w-[30rem] h-[30rem] rounded-full bg-[#d9aa9b]/25 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: "radial-gradient(#9b8165 1px, transparent 1px)", backgroundSize: "24px 24px", maskImage: "linear-gradient(135deg, black, transparent 46%, transparent)" }} />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[0.82fr_1fr] overflow-hidden rounded-[28px] border border-[#e7dac9] bg-[#fffdf8] shadow-[0_24px_70px_rgba(66,39,29,0.18)]">
        <section className="relative min-h-[300px] lg:min-h-[760px] overflow-hidden bg-gradient-to-br from-[#f5ecde] via-[#f3eadb] to-[#e8d9c5] px-7 py-8 md:px-12 md:py-11 flex flex-col justify-between">
          <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-[#d9aa9b]/45" />
          <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-[#a39118]/20" />
          <div className="relative z-10 flex items-center gap-4">
            <img src="/vetogrid-eagle.svg" alt="VetoGrid logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#45281e]">VetoGrid</h1>
              <p className="mt-1 text-sm text-[#725943]">Intelligent campus scheduling</p>
            </div>
          </div>

          <div className="relative z-10 mt-8 lg:mt-0">
            <div className="mb-7 max-w-sm">
              <p className="text-2xl md:text-[28px] leading-snug font-semibold text-[#4d2e22]">Smarter scheduling.<br />A more organized campus.</p>
              <div className="mt-4 h-1 w-24 rounded-full bg-[#a39118]" />
              <p className="mt-4 text-sm leading-relaxed text-[#765f4a]">Timetables, spaces, and campus events come together in one clear place.</p>
            </div>

            <div className="relative w-full max-w-xl aspect-[2/1] overflow-hidden rounded-2xl border border-[#dcc7aa] bg-[#eadac5] shadow-[0_12px_30px_rgba(66,39,29,0.16)]">
              <img
                src="/campus-gate.png"
                alt="Campus entrance at IIT Bhubaneswar"
                className="h-full w-full object-cover"
                style={{ filter: "sepia(.28) saturate(.78) contrast(.94)" }}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-[#e8d5b8]/20 mix-blend-soft-light" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#4b271c]/25 via-transparent to-[#f7f2e7]/10" />
            </div>
          </div>

          <p className="relative z-10 mt-6 text-xs font-medium tracking-wide text-[#806951]">Chitkara Institute of Technology</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-8 md:px-12 md:py-12 lg:px-14">
          <div className="mx-auto w-full max-w-xl">
            <Suspense
              fallback={
                <Card className="border border-[#e3d4c2] bg-[#fffdf8] p-8 text-center text-[#725f4d] shadow-lg">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#9a8715] mb-2" />
                  <p className="text-sm">Loading portal...</p>
                </Card>
              }
            >
              <LoginForm />
            </Suspense>
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#e7dccd] pt-4 text-[11px] text-[#806d5a]">
              <ShieldCheck className="w-4 h-4 text-[#838f3f]" />
              <span>Secure access · Chitkara Institute of Technology</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
