import { google } from "googleapis";

/**
 * Gmail HTTP API transport for noreply.agora.marketplace@gmail.com
 *
 * Uses the Gmail REST API (HTTPS, port 443) instead of SMTP (port 465/587),
 * so it works on hosting providers that block outbound SMTP traffic.
 *
 * Required .env vars:
 *   EMAIL_FROM            — noreply.agora.marketplace@gmail.com
 *   GOOGLE_CLIENT_ID      — from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — from Google Cloud Console
 *   GOOGLE_REFRESH_TOKEN  — generated via OAuth Playground with https://mail.google.com/ scope
 *                           while signed in as noreply.agora.marketplace@gmail.com
 */

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

/**
 * Build a RFC 2822 formatted email and base64url-encode it for the Gmail API.
 */
function buildRawEmail({ from, to, subject, html }) {
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    html,
  ];
  const rawMessage = messageParts.join("\r\n");
  // Gmail API expects base64url encoding
  return Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send an email via the Gmail REST API (no SMTP needed).
 */
async function sendMail({ to, subject, html }) {
  const raw = buildRawEmail({
    from: `"Agora Marketplace" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

export const sendVerificationEmail = async (email, url) => {
  await sendMail({
    to: email,
    subject: "Vérifiez votre adresse e-mail — Agora",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Bienvenue sur Agora 🎉</h2>
        <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail :</p>
        <a href="${url}" style="
          display:inline-block;padding:12px 24px;
          background:#4f46e5;color:#fff;border-radius:6px;
          text-decoration:none;font-weight:bold;">
          Vérifier mon adresse e-mail
        </a>
        <p style="color:#666;margin-top:16px;font-size:13px">
          Si vous n'avez pas créé de compte, ignorez cet e-mail.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email, url) => {
  await sendMail({
    to: email,
    subject: "Réinitialisation de votre mot de passe — Agora",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Cliquez ci-dessous pour choisir un nouveau mot de passe :</p>
        <a href="${url}" style="
          display:inline-block;padding:12px 24px;
          background:#4f46e5;color:#fff;border-radius:6px;
          text-decoration:none;font-weight:bold;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#666;margin-top:16px;font-size:13px">
          Ce lien expire dans 1 heure.
        </p>
      </div>
    `,
  });
};
