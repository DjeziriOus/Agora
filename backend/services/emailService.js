import nodemailer from "nodemailer";

/**
 * Gmail OAuth2 transporter for noreply.agora.marketplace@gmail.com
 *
 * Required .env vars:
 *   EMAIL_FROM            — noreply.agora.marketplace@gmail.com
 *   GOOGLE_CLIENT_ID      — from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — from Google Cloud Console
 *   GOOGLE_REFRESH_TOKEN  — generated via OAuth Playground with https://mail.google.com/ scope
 *                           while signed in as noreply.agora.marketplace@gmail.com
 */
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

export const sendVerificationEmail = async (email, url) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Agora Marketplace" <${process.env.EMAIL_FROM}>`,
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
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Agora Marketplace" <${process.env.EMAIL_FROM}>`,
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
