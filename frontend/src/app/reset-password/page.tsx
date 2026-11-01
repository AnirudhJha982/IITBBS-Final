"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { fetchBackend } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid reset token. Please request a new password reset link.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetchBackend("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md">
        <CardContent className="pt-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">Invalid Password Reset Link</h2>
          <p className="text-xs text-slate-400">
            This reset link is missing a security token or has already expired.
          </p>
          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-500 transition-colors"
            >
              Request New Link
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md">
        <CardContent className="pt-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">Password Successfully Updated</h2>
          <p className="text-xs text-slate-400">
            Your institutional password has been securely updated. You can now sign in with your new credentials.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs"
              onClick={() => router.push("/login")}
            >
              Sign In to vetogrid
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Set New Password</CardTitle>
        <CardDescription>
          Enter a new secure password for your Chitkara account.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              New Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 text-xs"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 text-xs"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
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
            disabled={loading || !newPassword || !confirmPassword}
          >
            {loading ? (
              "Updating Password..."
            ) : (
              <>
                Update Password
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>

          <div className="text-center w-full">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel and Back to Sign In
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-glow">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            vetogrid
          </h1>
          <p className="text-xs text-slate-400">
            Secure Account Recovery · Chitkara Institute of Technology
          </p>
        </div>

        <Suspense
          fallback={
            <Card className="border-surface-border/80 shadow-2xl bg-surface/90 backdrop-blur-md p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
              <p className="text-xs">Verifying reset token...</p>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PBKDF2 / SHA-256 secure credential hashing</span>
        </div>
      </div>
    </div>
  );
}

