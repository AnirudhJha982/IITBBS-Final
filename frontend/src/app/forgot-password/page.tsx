"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetchBackend("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        if (data.dev_reset_url) {
          setDevResetUrl(data.dev_reset_url);
        }
      } else {
        setError(data.message || "Failed to initiate password reset.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <img src="/vetogrid-eagle.svg" alt="vetogrid logo" className="inline-block w-12 h-12 object-contain mb-2" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            vetogrid
          </h1>
          <p className="text-xs text-slate-400">
            Secure Account Recovery · Chitkara Institute of Technology
          </p>
        </div>

        <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-500" />
              Reset Your Password
            </CardTitle>
            <CardDescription>
              Enter your institutional email address to receive single-use recovery instructions.
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-200">Recovery Link Dispatched</p>
                  <p className="mt-1 text-slate-300">
                    If an account matching <span className="font-mono text-emerald-300">{email}</span> exists in the Chitkara directory, a single-use token valid for 15 minutes has been generated.
                  </p>
                </div>
              </div>

              {devResetUrl && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2">
                  <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <span>⚡ Development / Testing Access</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Direct token reset link generated for local validation:
                  </p>
                  <a
                    href={devResetUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-500 transition-colors shadow-sm"
                  >
                    Proceed to Password Reset
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Institutional Email Address
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
                      placeholder="e.g. coordinator@chitkara.edu.in"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Supported: Chitkara faculty, coordinators, deans, and student reps.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs"
                  type="submit"
                  disabled={loading || !email}
                >
                  {loading ? (
                    "Dispatching Token..."
                  ) : (
                    <>
                      Send Password Reset Link
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>

                <div className="text-center w-full">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Single-use cryptographic HMAC token · 15-minute expiration</span>
        </div>
      </div>
    </div>
  );
}

