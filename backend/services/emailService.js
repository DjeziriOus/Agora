/**
 * @file Envoi d'e-mails via l'API HTTP Gmail (pas SMTP).
 *
 * Pourquoi HTTP plutôt que SMTP : beaucoup d'hébergeurs (Railway, Vercel)
 * bloquent le port 25 sortant. L'API Gmail passe par HTTPS et fonctionne
 * partout.
 *
 * Voir aussi : docs/modules/backend/services-emailService.md
 */

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
/**
 * Crée (ou réutilise) un client Gmail authentifié via OAuth 2 + refresh token.
 * Le SDK gère l'access_token automatiquement à partir du refresh_token.
 * @returns {import('googleapis').gmail_v1.Gmail}
 */
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

/**
 * Encode un sujet en RFC 2047 (`=?UTF-8?B?...?=`) pour que les accents
 * s'affichent correctement dans les clients mail.
 * @param {string} subject
 * @returns {string}
 */
function encodeSubject(subject) {
  // RFC 2047 encoded-word so accented characters render correctly in clients.
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

/**
 * Construit un message MIME complet encodé en base64url, prêt pour
 * `gmail.users.messages.send`.
 * @param {{to: string, subject: string, html: string, from?: string}} params
 * @returns {string} message MIME encodé
 */
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
 * Helper bas niveau d'envoi. Lance une exception en cas d'échec — l'appelant
 * choisit de la propager (email critique) ou de la silencer (notification).
 *
 * @param {{to: string, subject: string, html: string, from?: string}} params
 * @returns {Promise<Object>} Réponse de l'API Gmail
 * @throws {Error}
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
 * Wrapper fire-and-forget. Une erreur d'envoi est loggée mais jamais propagée.
 * À utiliser pour toutes les notifications non-critiques (commandes, statuts).
 *
 * @param {Object} payload - identique à `sendMail`
 * @param {string} [label="email"] - label pour les logs
 * @returns {Promise<void>}
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

/**
 * Envoie l'email de vérification d'adresse au moment de l'inscription.
 * CRITIQUE — lance une erreur si l'envoi échoue (l'utilisateur ne peut pas
 * activer son compte sans cet email).
 * @param {string} email
 * @param {string} url - lien de vérification généré par Better Auth
 */
export async function sendVerificationEmail(email, url) {
  const { subject, html } = verificationEmailTemplate(url);
  await sendMail({ to: email, subject, html });
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * @param {string} email
 * @param {string} url - lien généré par Better Auth
 */
export async function sendPasswordResetEmail(email, url) {
  const { subject, html } = passwordResetTemplate(url);
  await sendMail({ to: email, subject, html });
}

/**
 * Envoie l'email récap de commande à l'acheteur (fire-and-forget).
 * @param {string} buyerEmail
 * @param {Object} order - objet commande sérialisé pour le template
 */
export function sendOrderReceiptEmail(buyerEmail, order) {
  const { subject, html } = orderReceiptTemplate(order);
  return sendMailQuiet({ to: buyerEmail, subject, html }, "order-receipt");
}

/**
 * Notifie un vendeur de l'arrivée d'une nouvelle sous-commande (fire-and-forget).
 * @param {string} sellerEmail
 * @param {Object} payload - données préparées pour `sellerNewOrderTemplate`
 */
export function sendSellerNewOrderEmail(sellerEmail, payload) {
  const { subject, html } = sellerNewOrderTemplate(payload);
  return sendMailQuiet({ to: sellerEmail, subject, html }, "seller-new-order");
}

/**
 * Notifie l'acheteur d'un changement de statut d'une sous-commande
 * (en préparation → expédiée → livrée, etc.). Fire-and-forget.
 * @param {string} buyerEmail
 * @param {Object} payload - données préparées pour `orderStatusUpdateTemplate`
 */
export function sendOrderStatusUpdateEmail(buyerEmail, payload) {
  const { subject, html } = orderStatusUpdateTemplate(payload);
  return sendMailQuiet(
    { to: buyerEmail, subject, html },
    "order-status-update"
  );
}
