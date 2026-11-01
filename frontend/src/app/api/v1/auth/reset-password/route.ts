import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetToken, updateUserPassword } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, new_password } = body as { token?: string; new_password?: string };

    if (!token || !new_password) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required." },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const verification = verifyPasswordResetToken(token);
    if (!verification) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token. Please request a new link." },
        { status: 400 }
      );
    }

    const updated = updateUserPassword(verification.email, new_password, token);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User account could not be found." },
        { status: 404 }
      );
    }

    // Send confirmation notification
    await sendNotification({
      recipient: verification.email,
      category: "password_reset",
      title: "CampusOS AI — Password Successfully Changed",
      message: "The password for your Chitkara account has been updated successfully. If you did not make this change, contact your Super Admin immediately.",
      channels: ["email", "in_app"],
    });

    return NextResponse.json(
      { success: true, message: "Password has been successfully reset. You may now sign in." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

