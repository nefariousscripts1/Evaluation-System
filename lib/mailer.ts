type PasswordResetMailInput = {
  email: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: PasswordResetMailInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!resendApiKey || !emailFrom) {
    console.log(`Password reset requested for ${email}: ${resetUrl}`);
    return { delivered: false, provider: "console" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: "Reset your password",
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>If you did not request this, you can ignore this message.</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send reset email: ${errorBody}`);
  }

  return { delivered: true, provider: "resend" };
}
