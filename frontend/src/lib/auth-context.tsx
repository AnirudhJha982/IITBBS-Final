/**
 * CampusOS AI - Auth Context
 * Provides current user role to all client components via React Context.
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser, UserRole } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  role: UserRole | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  role: null,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (isLoading || user || pathname === "/login") return;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [isLoading, pathname, router, user]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // ignore network error on logout
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  if (pathname !== "/login" && (isLoading || !user)) {
    return (
      <div className="min-h-screen bg-navy-950" aria-label="Checking session" />
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, role: user?.role ?? null, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/** Hook that returns whether the current user has a specific permission. */
export function usePermission(
  check: (role: UserRole) => boolean
): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return check(role);
}

