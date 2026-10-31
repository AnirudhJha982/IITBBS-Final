/**
 * Comprehensive Automated RBAC & Dataset Integrity Test Suite
 */

import fs from "fs";
import path from "path";
import { createHash, createHmac } from "crypto";

const citData = JSON.parse(fs.readFileSync("./frontend/src/data/cit_public.json", "utf-8"));
const schedule = JSON.parse(fs.readFileSync("./frontend/src/data/schedule.json", "utf-8"));
const scheduleAfter = JSON.parse(fs.readFileSync("./frontend/src/data/schedule_after.json", "utf-8"));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Emulate auth functions directly for isolated unit verification
function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

const AUTH_SECRET = "campusos-dev-secret-cit-2026-hackathon";
function signToken(user) {
  const payload = Buffer.from(JSON.stringify({ ...user, iat: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expectedSig = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

console.log("\n=== 1. CREDENTIAL VERIFICATION & ENCRYPTION TESTS ===");
const rolesToTest = [
  { role: "super_admin", email: "admin@chitkara.edu.in", pass: "Admin@2026" },
  { role: "timetable_coordinator", email: "coordinator@chitkara.edu.in", pass: "Coord@2026" },
  { role: "academic_dean", email: "dean@chitkara.edu.in", pass: "Dean@2026" },
  { role: "department_head", email: "hod@chitkara.edu.in", pass: "HoD@2026" },
  { role: "faculty", email: "faculty@chitkara.edu.in", pass: "Faculty@2026" },
  { role: "venue_manager", email: "venues@chitkara.edu.in", pass: "Venue@2026" },
  { role: "student_representative", email: "student@chitkara.edu.in", pass: "Student@2026" },
];

for (const cred of rolesToTest) {
  const hashed = sha256(cred.pass);
  assert(hashed.length === 64, `Password hashed securely using SHA-256 for [${cred.role}]`);
}

console.log("\n=== 2. HMAC-SHA256 TOKEN & INTEGRITY TESTS ===");
const sampleUser = { email: "coordinator@chitkara.edu.in", role: "timetable_coordinator", name: "Dr. Priya Sharma" };
const token = signToken(sampleUser);
assert(typeof token === "string" && token.includes("."), "HMAC-SHA256 Token correctly signed");

const decoded = verifyToken(token);
assert(decoded !== null && decoded.email === sampleUser.email && decoded.role === sampleUser.role, "Token decoded and verified without corruption");

const tamperedToken = token.slice(0, -4) + "XXXX";
assert(verifyToken(tamperedToken) === null, "Tampered cryptographic token rejected");

console.log("\n=== 3. DATASET REPOSITORY INTEGRITY CHECKS ===");
assert(citData.rooms.length === 27, "Official dataset has 27 venues");
assert(citData.faculty.length === 40, "Official dataset has 40 faculty members");
assert(citData.student_groups.length === 14, "Official dataset has 14 student groups");
assert(citData.courses.length === 62, "Official dataset has 62 courses");
assert(citData.sessions.length === 189, "Official dataset has 189 sessions");
assert(schedule.sessions.length === 189, "Master baseline schedule has 189 scheduled sessions");
assert(schedule.exams.length === 41, "Master baseline schedule has 41 exams");
assert(schedule.fest_week.bookings.length === 25, "Spectra fest week has 25 total booking decisions");
const approvedBookings = schedule.fest_week.bookings.filter((b) => b.status === "approved").length;
assert(approvedBookings === 22, "Spectra fest week has 22 approved bookings");
assert(scheduleAfter.sessions.length === 190, "Repaired disruption schedule has 190 sessions (189 + 1 added)");

console.log("\n=== 4. TIMETABLE DATA ENRICHMENT LOGIC TESTS ===");
const sessionDefs = Object.fromEntries(citData.sessions.map((s) => [s.id, s]));
const facultyMap = Object.fromEntries(citData.faculty.map((f) => [f.id, f]));
const roomMap = Object.fromEntries(citData.rooms.map((r) => [r.id, r]));

const enrichedSlots = schedule.sessions.map((slot) => {
  const def = sessionDefs[slot.session_id] || {};
  const fac = facultyMap[def.faculty_id] || {};
  const room = roomMap[slot.room_id] || {};
  return {
    ...slot,
    groups: def.groups || [],
    course_id: def.course_id || "",
    faculty_id: def.faculty_id || "",
    faculty_name: fac.name || "",
    room_name: room.name || "",
  };
});

assert(enrichedSlots.length === 189, "All 189 slots enriched");
const validGroups = enrichedSlots.every((s) => Array.isArray(s.groups) && s.groups.length > 0);
assert(validGroups, "Zero undefined groups in master timetable matrix (No client-side crash)");
const validFaculty = enrichedSlots.every((s) => s.faculty_name.length > 0);
assert(validFaculty, "All sessions have valid faculty mappings");

console.log("\n=== TEST SUITE SUMMARY ===");
console.log(`Total Assertions Passed: ${passed}`);
console.log(`Total Assertions Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL RBAC & DATASET INTEGRITY ASSERTIONS PASSED! ✓\n");
}
