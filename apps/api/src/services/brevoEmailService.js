const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

function requireConfig(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordResetEmail({ email, fullName, resetUrl }) {
  const apiKey = requireConfig("BREVO_API_KEY");
  const senderEmail = requireConfig("BREVO_SENDER_EMAIL");
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "School Management";
  const safeName = escapeHtml(fullName || "there");
  const safeUrl = escapeHtml(resetUrl);

  const response = await fetch(BREVO_EMAIL_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email, name: fullName || undefined }],
      subject: "Reset your password",
      textContent: `Hello ${fullName || "there"},\n\nWe received a request to reset your password. Use this link within 60 minutes:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
      htmlContent: `
        <p>Hello ${safeName},</p>
        <p>We received a request to reset your password.</p>
        <p><a href="${safeUrl}">Reset your password</a></p>
        <p>This link expires in 60 minutes and can be used once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo rejected the email request (${response.status}): ${detail.slice(0, 500)}`);
  }
}
