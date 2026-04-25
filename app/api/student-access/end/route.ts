import { clearStudentAccessCookie } from "@/lib/student-access";
import { apiSuccess, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    await clearStudentAccessCookie();
    return apiSuccess({ ended: true });
  } catch (error) {
    return handleApiError(error, "Failed to end student access session");
  }
}
