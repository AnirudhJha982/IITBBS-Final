/**
 * CampusOS AI - Authentication Utilities
 * Next.js-native auth for Vercel serverless deployment.
 * Uses Node.js crypto (available in Next.js API route runtime).
 * Protected API routes verify the signed session token.
 */

import { createHash, createHmac } from "crypto";

export const AUTH_COOKIE = "campusos_session";
const DEVELOPMENT_AUTH_SECRET = "campusos-dev-secret-cit-2026-hackathon";

function getAuthSecret(): string | null {
  const configuredSecret = process.env.CAMPUSOS_AUTH_SECRET;
  if (configuredSecret && configuredSecret.length >= 32) return configuredSecret;
  return process.env.NODE_ENV === "production" ? null : DEVELOPMENT_AUTH_SECRET;
}

// ── Role types ──────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "timetable_coordinator"
  | "academic_dean"
  | "department_coordinator"
  | "department_head"
  | "faculty"
  | "club_representative"
  | "venue_manager"
  | "student_representative";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  /** faculty_id (e.g. "F12") or group_id (e.g. "CSE-2") for filtered views */
  entityId?: string;
  iat?: number;
}

// ── Password hashing (SHA-256, suitable for demo/hackathon) ────────────────

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// ── User store ─────────────────────────────────────────────────────────────

const USER_STORE: Record<string, { hash: string; user: AuthUser }> = {
  "admin@chitkara.edu.in": {
    hash: sha256("Admin@2026"),
    user: {
      userId: "usr-001",
      email: "admin@chitkara.edu.in",
      name: "Admin (Dean's Office)",
      role: "super_admin",
    },
  },
  "coordinator@chitkara.edu.in": {
    hash: sha256("Coord@2026"),
    user: {
      userId: "usr-002",
      email: "coordinator@chitkara.edu.in",
      name: "Dr. Priya Sharma",
      role: "timetable_coordinator",
    },
  },
  "dean@chitkara.edu.in": {
    hash: sha256("Dean@2026"),
    user: {
      userId: "usr-003",
      email: "dean@chitkara.edu.in",
      name: "Prof. S.K. Mehta",
      role: "academic_dean",
    },
  },
  "hod@chitkara.edu.in": {
    hash: sha256("HoD@2026"),
    user: {
      userId: "usr-004",
      email: "hod@chitkara.edu.in",
      name: "Dr. Anita Verma",
      role: "department_head",
      department: "ECE",
    },
  },
  "dept.coordinator@chitkara.edu.in": {
    hash: sha256("DeptCoord@2026"),
    user: {
      userId: "usr-008",
      email: "dept.coordinator@chitkara.edu.in",
      name: "Prof. Neha Das",
      role: "department_coordinator",
      department: "ECE",
    },
  },
  "faculty@chitkara.edu.in": {
    hash: sha256("Faculty@2026"),
    user: {
      userId: "usr-005",
      email: "faculty@chitkara.edu.in",
      name: "Dr. Amit Behera",
      role: "faculty",
      department: "ECE",
      entityId: "F12",
    },
  },
  "venues@chitkara.edu.in": {
    hash: sha256("Venue@2026"),
    user: {
      userId: "usr-006",
      email: "venues@chitkara.edu.in",
      name: "Mr. Rajan Singh",
      role: "venue_manager",
    },
  },
  "student@chitkara.edu.in": {
    hash: sha256("Student@2026"),
    user: {
      userId: "usr-007",
      email: "student@chitkara.edu.in",
      name: "Arjun Patel",
      role: "student_representative",
      department: "CSE",
      entityId: "CSE-2",
    },
  },
  "club@chitkara.edu.in": {
    hash: sha256("Club@2026"),
    user: {
      userId: "usr-009",
      email: "club@chitkara.edu.in",
      name: "Aarav Sen",
      role: "club_representative",
      entityId: "Coding Club",
    },
  },
};

export function verifyCredentials(
  email: string,
  password: string
): AuthUser | null {
  const entry = USER_STORE[email.toLowerCase().trim()];
  if (!entry) return null;
  if (sha256(password) !== entry.hash) return null;
  return entry.user;
}

// ── Token sign / verify (HMAC-SHA256) ──────────────────────────────────────

export function signToken(user: AuthUser): string {
  const authSecret = getAuthSecret();
  if (!authSecret) {
    throw new Error("CAMPUSOS_AUTH_SECRET must be set to a 32-character secret in production.");
  }
  const payload = Buffer.from(
    JSON.stringify({ ...user, iat: Date.now() })
  ).toString("base64url");
  const sig = createHmac("sha256", authSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const authSecret = getAuthSecret();
    if (!authSecret) return null;
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expectedSig = createHmac("sha256", authSecret)
      .update(payload)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    ) as AuthUser & { iat: number };
    // 8-hour expiry
    if (Date.now() - (data.iat ?? 0) > 8 * 60 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Cookie options ──────────────────────────────────────────────────────────

export const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export function buildSetCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function buildClearCookieHeader(): string {
  return `${AUTH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

// ── UI helpers ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Admin (Dean's office)",
  timetable_coordinator: "Timetable Coordinator",
  academic_dean: "Academic Dean",
  department_coordinator: "Department coordinator",
  department_head: "Department Head",
  faculty: "Faculty",
  club_representative: "Club representative",
  venue_manager: "Venue Manager",
  student_representative: "Student Representative",
};

export const ROLE_INITIALS: Record<UserRole, string> = {
  super_admin: "AD",
  timetable_coordinator: "TC",
  academic_dean: "AD",
  department_coordinator: "DC",
  department_head: "DH",
  faculty: "FM",
  club_representative: "CR",
  venue_manager: "VM",
  student_representative: "SR",
};

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/dashboard",
  timetable_coordinator: "/dashboard",
  academic_dean: "/dashboard",
  department_coordinator: "/dashboard",
  department_head: "/dashboard",
  faculty: "/timetable",
  club_representative: "/venue-bookings",
  venue_manager: "/venue-bookings",
  student_representative: "/timetable",
};

// ── Permission helpers ──────────────────────────────────────────────────────

export const PERMISSIONS = {
  canGenerateTimetable: (r: UserRole) =>
    ["super_admin", "timetable_coordinator"].includes(r),
  canEditTimetable: (r: UserRole) =>
    ["super_admin", "timetable_coordinator", "department_coordinator"].includes(r),
  canScheduleExams: (r: UserRole) =>
    ["super_admin", "timetable_coordinator"].includes(r),
  canApproveBookings: (r: UserRole) =>
    ["super_admin", "academic_dean", "venue_manager", "department_coordinator"].includes(r),
  canManageRooms: (r: UserRole) =>
    ["super_admin", "venue_manager"].includes(r),
  canViewAnalytics: (r: UserRole) =>
    !["student_representative", "club_representative"].includes(r),
  canManageUsers: (r: UserRole) => r === "super_admin",
  canManageSettings: (r: UserRole) => r === "super_admin",
  canManualSchedule: (r: UserRole) =>
    ["super_admin", "timetable_coordinator"].includes(r),
  canReschedule: (r: UserRole) =>
    ["super_admin", "timetable_coordinator", "academic_dean", "department_coordinator"].includes(r),
  canViewFaculty: (r: UserRole) =>
    !["student_representative", "club_representative"].includes(r),
  canViewApprovals: (r: UserRole) =>
    ["super_admin", "academic_dean", "venue_manager", "department_coordinator"].includes(r),
  canRequestBooking: (r: UserRole) =>
    ["super_admin", "department_coordinator", "faculty", "club_representative", "venue_manager"].includes(r),
};

// ── Password Reset (HMAC-SHA256, 15m expiration, single-use) ────────────────

const USED_RESET_TOKENS = new Set<string>();

export function createPasswordResetToken(email: string): string | null {
  const normEmail = email.toLowerCase().trim();
  if (!USER_STORE[normEmail]) return null;
  const authSecret = getAuthSecret() || DEVELOPMENT_AUTH_SECRET;
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
  const nonce = createHash("sha256").update(`${Math.random()}-${Date.now()}`).digest("hex").slice(0, 16);
  const payload = Buffer.from(JSON.stringify({ email: normEmail, exp: expiresAt, nonce })).toString("base64url");
  const sig = createHmac("sha256", authSecret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyPasswordResetToken(token: string): { email: string } | null {
  try {
    if (USED_RESET_TOKENS.has(token)) return null;
    const authSecret = getAuthSecret() || DEVELOPMENT_AUTH_SECRET;
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expectedSig = createHmac("sha256", authSecret).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.email || !data.exp) return null;
    if (Date.now() > data.exp) return null; // expired
    return { email: data.email };
  } catch {
    return null;
  }
}

export function updateUserPassword(email: string, newPass: string, tokenToInvalidate?: string): boolean {
  const normEmail = email.toLowerCase().trim();
  if (!USER_STORE[normEmail]) return false;
  USER_STORE[normEmail].hash = sha256(newPass);
  if (tokenToInvalidate) {
    USED_RESET_TOKENS.add(tokenToInvalidate);
  }
  return true;
}


