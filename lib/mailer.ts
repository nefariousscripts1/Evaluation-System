import nodemailer from "nodemailer";

type MailRecipient = string | string[];

type SendMailInput = {
  to: MailRecipient;
  bcc?: MailRecipient;
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
};

type FacultyResultsMailInput = {
  recipients: string[];
  academicYear: string;
  semester: string;
};

function getEmailFrom() {
  return process.env.EMAIL_FROM || process.env.GMAIL_USER || "no-reply@example.com";
}

function getEmailSenderAddress() {
  const emailFrom = process.env.EMAIL_FROM;
  const matchedAddress = emailFrom?.match(/<([^>]+)>/);

  if (matchedAddress?.[1]) {
    return matchedAddress[1];
  }

  return process.env.GMAIL_USER || emailFrom || "no-reply@example.com";
}

function getAppPortalUrl() {
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${baseUrl}`;
}

function getFacultyResultsUrl() {
  return getAppPortalUrl();
}

export function getEmailDeliveryProvider() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return "gmail" as const;
  }

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    return "resend" as const;
  }

  return null;
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
    bcc: input.bcc ? normalizeRecipients(input.bcc) : undefined,
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
      bcc: input.bcc ? normalizeRecipients(input.bcc) : undefined,
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
  const provider = getEmailDeliveryProvider();

  if (provider === "gmail") {
    const gmailResult = await sendViaGmail(input);
    if (gmailResult) {
      return gmailResult;
    }
  }

  if (provider === "resend") {
    const resendResult = await sendViaResend(input);
    if (resendResult) {
      return resendResult;
    }
  }

  console.log("Email delivery fallback:", {
    to: normalizeRecipients(input.to),
    bcc: input.bcc ? normalizeRecipients(input.bcc) : [],
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
  const portalUrl = getAppPortalUrl();

  const result = await sendEmail({
    to: getEmailSenderAddress(),
    bcc: recipients,
    subject: `Evaluation is now open: ${academicYear} ${semester}`,
    text: [
      "The evaluation session is now open.",
      `Academic Year: ${academicYear}`,
      `Semester: ${semester}`,
      `Period: ${startLabel} to ${endLabel}`,
      `Open the system: ${portalUrl}`,
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
        <p><a href="${portalUrl}" style="display: inline-block; margin-top: 8px; border-radius: 999px; background: #24135f; color: #ffffff; padding: 12px 18px; text-decoration: none; font-weight: 700;">Open Digital Evaluation System</a></p>
      </div>
    `,
  });

  return {
    ...result,
    recipientCount: recipients.length,
  };
}

export async function sendFacultyResultsAvailableAnnouncement({
  recipients,
  academicYear,
  semester,
}: FacultyResultsMailInput) {
  if (recipients.length === 0) {
    return { delivered: false, provider: "none" as const, recipientCount: 0 };
  }

  const resultsUrl = getFacultyResultsUrl();

  const result = await sendEmail({
    to: getEmailSenderAddress(),
    bcc: recipients,
    subject: `Your evaluation results are now available: ${academicYear} ${semester}`,
    text: [
      "Your evaluation results are now available.",
      `Academic Year: ${academicYear}`,
      `Semester: ${semester}`,
      `View your results here: ${resultsUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #24135f; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Evaluation results are now available</h2>
        <p>You can now view your evaluation results in the Digital Evaluation System.</p>
        <p><strong>Academic Year:</strong> ${academicYear}</p>
        <p><strong>Semester:</strong> ${semester}</p>
        <p><a href="${resultsUrl}" style="display: inline-block; margin-top: 8px; border-radius: 999px; background: #24135f; color: #ffffff; padding: 12px 18px; text-decoration: none; font-weight: 700;">View My Results</a></p>
      </div>
    `,
  });

  return {
    ...result,
    recipientCount: recipients.length,
  };
}
