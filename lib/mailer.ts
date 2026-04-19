import nodemailer from "nodemailer";

type MailRecipient = string | string[];

type SendMailInput = {
  to: MailRecipient;
  subject: string;
  html: string;
  text?: string;
};

type PasswordResetMailInput = {
  email: string;
  resetUrl: string;
};

type EvaluationOpenMailInput = {
  recipients: string[];
  academicYear: string;
  semester: string;
  startDate: Date;
  endDate: Date;
  accessCode: string | null;
};

function getEmailFrom() {
  return process.env.EMAIL_FROM || process.env.GMAIL_USER || "no-reply@example.com";
}

function normalizeRecipients(to: MailRecipient) {
  return Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
}

async function sendViaGmail(input: SendMailInput) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: getEmailFrom(),
    to: normalizeRecipients(input.to),
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { delivered: true, provider: "gmail" as const };
}

async function sendViaResend(input: SendMailInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!resendApiKey || !emailFrom) {
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: normalizeRecipients(input.to),
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send email via Resend: ${errorBody}`);
  }

  return { delivered: true, provider: "resend" as const };
}

export async function sendEmail(input: SendMailInput) {
  const gmailResult = await sendViaGmail(input);
  if (gmailResult) {
    return gmailResult;
  }

  const resendResult = await sendViaResend(input);
  if (resendResult) {
    return resendResult;
  }

  console.log("Email delivery fallback:", {
    to: normalizeRecipients(input.to),
    subject: input.subject,
    text: input.text,
  });

  return { delivered: false, provider: "console" as const };
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: PasswordResetMailInput) {
  return sendEmail({
    to: email,
    subject: "Reset your password",
    text: `Reset your password using this link: ${resetUrl}`,
    html: `
      <p>Hello,</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>If you did not request this, you can ignore this message.</p>
    `,
  });
}

export async function sendEvaluationOpenAnnouncement({
  recipients,
  academicYear,
  semester,
  startDate,
  endDate,
  accessCode,
}: EvaluationOpenMailInput) {
  if (recipients.length === 0) {
    return { delivered: false, provider: "none" as const, recipientCount: 0 };
  }

  const startLabel = startDate.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endLabel = endDate.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const result = await sendEmail({
    to: recipients,
    subject: `Evaluation is now open: ${academicYear} ${semester}`,
    text: [
      "The evaluation session is now open.",
      `Academic Year: ${academicYear}`,
      `Semester: ${semester}`,
      `Period: ${startLabel} to ${endLabel}`,
      accessCode ? `Portal Access Code: ${accessCode}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #24135f; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Evaluation is now open</h2>
        <p>The evaluation session is now open for your portal.</p>
        <p><strong>Academic Year:</strong> ${academicYear}</p>
        <p><strong>Semester:</strong> ${semester}</p>
        <p><strong>Period:</strong> ${startLabel} to ${endLabel}</p>
        ${
          accessCode
            ? `<p><strong>Portal Access Code:</strong> <span style="letter-spacing: 0.18em;">${accessCode}</span></p>`
            : ""
        }
        <p>Please log in to the Digital Evaluation System to continue.</p>
      </div>
    `,
  });

  return {
    ...result,
    recipientCount: recipients.length,
  };
}
