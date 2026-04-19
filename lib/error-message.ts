export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (typeof error === "string") {
    if (
      error.includes("Unique constraint failed") &&
      (error.includes("User_email_key") || error.includes("`email`"))
    ) {
      return "An account with this email address already exists";
    }

    return error;
  }

  if (error instanceof Error) {
    return getErrorMessage(error.message, fallback);
  }

  return fallback;
}
