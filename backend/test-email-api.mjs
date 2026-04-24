// Gmail REST API test — node test-email-api.mjs
import "dotenv/config";
import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

const html = `<div style="font-family:sans-serif"><h2>Test from Gmail API 🎉</h2><p>If you see this, the Gmail REST API is working!</p></div>`;

const raw = Buffer.from(
  [
    `From: "Agora Test" <${process.env.EMAIL_FROM}>`,
    `To: ${process.env.EMAIL_FROM}`,
    `Subject: Agora Gmail API Test`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    html,
  ].join("\r\n"),
)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("Testing Gmail REST API (HTTPS, no SMTP)...");
console.log("From:", process.env.EMAIL_FROM);

try {
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  console.log("\n✅ Email sent via Gmail API!");
  console.log("Message ID:", res.data.id);
  console.log("Check the inbox of", process.env.EMAIL_FROM);
} catch (err) {
  console.error("\n❌ Failed:", err.message);
  if (err.response?.data) console.error("Details:", JSON.stringify(err.response.data, null, 2));
}
