import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const user = verifyToken(token);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Session expired or invalid." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      entityId: user.entityId,
    },
  });
}

