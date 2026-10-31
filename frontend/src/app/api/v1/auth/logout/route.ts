import { NextResponse } from "next/server";
import { buildClearCookieHeader } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { success: true, message: "Logged out successfully." },
    {
      status: 200,
      headers: { "Set-Cookie": buildClearCookieHeader() },
    }
  );
}

