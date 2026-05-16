import { google } from "googleapis";
import {
  verificationEmailTemplate,
  passwordResetTemplate,
  orderReceiptTemplate,
  sellerNewOrderTemplate,
  orderStatusUpdateTemplate,
} from "./emailTemplates.js";

/**
 * Gmail REST API transport for the Agora marketplace mailbox.
 *
 * We use the Gmail HTTP API (HTTPS, port 443) instead of SMTP so the app
 * works on hosting providers that block outbound SMTP traffic. The mailbox
 * is authorized once via the OAuth Playground; the refresh token is stored
 * in the environment and the access token is regenerated automatically.
 *
 * Required env vars:
 *   EMAIL_FROM            noreply.agora.marketplace@gmail.com
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN  (https://mail.google.com/ scope)
 */

let cachedGmail = null;
function getGmailClient() {
  if (cachedGmail) return cachedGmail;
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  cachedGmail = google.gmail({ version: "v1", auth: oAuth2Client });
  return cachedGmail;
}

function encodeSubject(subject) {
  // RFC 2047 encoded-word so accented characters render correctly in clients.
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function buildRawMessage({ to, subject, html, from }) {
  const fromHeader = from || `"Agora" <${process.env.EMAIL_FROM}>`;
  const message = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf-8").toString("base64"),
  ].join("\r\n");

  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Low-level send helper. Throws on transport failure so callers can decide
 * whether the failure is fatal or fire-and-forget.
 */
export async function sendMail({ to, subject, html, from }) {
  if (!to) throw new Error("sendMail: recipient (to) is required");
  if (!process.env.EMAIL_FROM) {
    throw new Error("sendMail: EMAIL_FROM env var is not configured");
  }

  const gmail = getGmailClient();
  const raw = buildRawMessage({ to, subject, html, from });

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  return res.data;
}

/**
 * Fire-and-forget wrapper used by background notifications. We never want
 * a transient mail failure to break an order flow — log the error and move
 * on instead of throwing.
 */
function sendMailQuiet(payload, label = "email") {
  return sendMail(payload).catch((err) => {
    console.error(
      `[emailService] failed to send "${label}" to ${payload.to}:`,
      err?.message || err
    );
  });
}

// ─── Public notification functions ────────────────────────────────────────

export async function sendVerificationEmail(email, url) {
  const { subject, html } = verificationEmailTemplate(url);
  await sendMail({ to: email, subject, html });
}

export async function sendPasswordResetEmail(email, url) {
  const { subject, html } = passwordResetTemplate(url);
  await sendMail({ to: email, subject, html });
}

export function sendOrderReceiptEmail(buyerEmail, order) {
  const { subject, html } = orderReceiptTemplate(order);
  return sendMailQuiet({ to: buyerEmail, subject, html }, "order-receipt");
}

export function sendSellerNewOrderEmail(sellerEmail, payload) {
  const { subject, html } = sellerNewOrderTemplate(payload);
  return sendMailQuiet({ to: sellerEmail, subject, html }, "seller-new-order");
}

export function sendOrderStatusUpdateEmail(buyerEmail, payload) {
  const { subject, html } = orderStatusUpdateTemplate(payload);
  return sendMailQuiet(
    { to: buyerEmail, subject, html },
    "order-status-update"
  );
}
