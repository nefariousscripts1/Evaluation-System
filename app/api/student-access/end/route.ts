import { NextResponse } from "next/server";
import { clearStudentAccessCookie } from "@/lib/student-access";

export async function POST() {
  await clearStudentAccessCookie();
  return NextResponse.json({ success: true });
}
