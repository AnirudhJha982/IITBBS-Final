import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  signToken,
  buildSetCookieHeader,
  ROLE_HOME,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = verifyCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    const token = signToken(user);
    const cookieHeader = buildSetCookieHeader(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          entityId: user.entityId,
        },
        redirectTo: ROLE_HOME[user.role],
      },
      {
        status: 200,
        headers: { "Set-Cookie": cookieHeader },
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

