import { NextResponse } from "next/server";
import { authorizeStaffCredentials } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await authorizeStaffCredentials(body);

    if (result.ok) {
      return NextResponse.json({
        ok: true,
        reason: "success",
      });
    }

    const reason =
      result.reason === "user_not_found" ||
      result.reason === "user_deleted" ||
      result.reason === "role_mismatch" ||
      result.reason === "password_invalid"
        ? "invalid_credentials"
        : result.reason;

    return NextResponse.json({
      ok: false,
      reason,
      details:
        reason === "database_unreachable" || reason === "server_error"
          ? result.details ?? null
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: "server_error",
        details: {
          message: error instanceof Error ? error.message : "Unknown diagnostics error",
        },
      },
      { status: 500 }
    );
  }
}
