/**
 * Branded HTML email templates for Agora — all in French.
 *
 * Each public builder returns `{ subject, html }` ready to pass to
 * `sendMail()`. Designs follow the Agora palette defined in
 * frontend/app/globals.css:
 *   primary  #5c6bc0   gold #ffa726   green #26a69a
 *   ink      #1a1a2e   mid  #5e6272   accent #e8eaf6
 *   line     #c5cae9   bg   #f4f5f9
 *
 * Logo is referenced from `${FRONTEND_URL}/logo.png` so we don't have to
 * ship binary assets through Gmail.
 */

const PALETTE = {
  primary: "#5c6bc0",
  primaryHover: "#4a58ad",
  accent: "#e8eaf6",
  gold: "#ffa726",
  green: "#26a69a",
  danger: "#ef5350",
  ink: "#1a1a2e",
  mid: "#5e6272",
  line: "#c5cae9",
  bg: "#f4f5f9",
  surface: "#ffffff",
};

const STATUS_STEPS = [
  { key: "en_attente", label: "En Attente", color: "#3d4561" },
  { key: "en_preparation", label: "En Préparation", color: PALETTE.gold },
  { key: "en_livraison", label: "En Livraison", color: PALETTE.primary },
  { key: "livree", label: "Livrée", color: PALETTE.green },
];

const STATUS_LABELS = {
  en_attente: "En Attente",
  en_preparation: "En Préparation",
  en_livraison: "En Livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

const frontend = () =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const logoUrl = () => `${frontend()}/logo.png`;

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatPrice = (value) => {
  const n = Number(value || 0);
  return `${n.toFixed(2).replace(".", ",")} €`;
};

const formatDate = (value) => {
  try {
    const d = value ? new Date(value) : new Date();
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const shortOrderId = (id) => {
  const s = String(id || "");
  return s.length > 8 ? s.slice(-8).toUpperCase() : s.toUpperCase();
};

// ─── Layout primitives ────────────────────────────────────────────────────

function layout({ preheader = "", title, intro, body, footerNote = "" }) {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${PALETTE.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${PALETTE.ink};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escape(preheader)}</span>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${PALETTE.bg};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background:${PALETTE.surface};border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(26,26,46,0.08);">
            <tr>
              <td style="background:${PALETTE.ink};padding:24px 32px;text-align:center;">
                <img src="${logoUrl()}" alt="Agora" width="140" style="display:inline-block;max-width:140px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 8px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;line-height:1.3;color:${PALETTE.ink};">${escape(title)}</h1>
                ${intro ? `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${PALETTE.mid};">${intro}</p>` : ""}
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:${PALETTE.accent};border-top:1px solid ${PALETTE.line};text-align:center;">
                <p style="margin:0 0 6px 0;font-size:13px;color:${PALETTE.mid};">${footerNote || "Vous recevez cet e-mail car vous avez un compte sur Agora."}</p>
                <p style="margin:0;font-size:12px;color:${PALETTE.mid};">© ${new Date().getFullYear()} Agora · <a href="${frontend()}" style="color:${PALETTE.primary};text-decoration:none;">agora.fr</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label, url, color = PALETTE.primary) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0;">
    <tr>
      <td style="background:${color};border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;font-family:inherit;">${escape(label)}</a>
      </td>
    </tr>
  </table>`;
}

function infoCard(rows) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${PALETTE.accent};border:1px solid ${PALETTE.line};border-radius:10px;margin:16px 0;">
    <tr>
      <td style="padding:16px 20px;">
        ${rows
          .map(
            ([k, v]) =>
              `<div style="font-size:13px;color:${PALETTE.mid};margin-bottom:8px;"><span style="color:${PALETTE.ink};font-weight:600;">${escape(k)} :</span> ${v}</div>`
          )
          .join("")}
      </td>
    </tr>
  </table>`;
}

function itemsTable(items) {
  const rows = items
    .map(
      (it) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid ${PALETTE.line};font-size:14px;color:${PALETTE.ink};">${escape(it.name)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid ${PALETTE.line};font-size:14px;color:${PALETTE.mid};text-align:center;">${Number(it.quantity || 0)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid ${PALETTE.line};font-size:14px;color:${PALETTE.mid};text-align:right;">${formatPrice(it.unitPrice)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid ${PALETTE.line};font-size:14px;color:${PALETTE.ink};text-align:right;font-weight:600;">${formatPrice(Number(it.unitPrice || 0) * Number(it.quantity || 0))}</td>
        </tr>`
    )
    .join("");

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
    <thead>
      <tr style="background:${PALETTE.bg};">
        <th align="left" style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:${PALETTE.mid};border-bottom:2px solid ${PALETTE.line};">Article</th>
        <th align="center" style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:${PALETTE.mid};border-bottom:2px solid ${PALETTE.line};">Qté</th>
        <th align="right" style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:${PALETTE.mid};border-bottom:2px solid ${PALETTE.line};">Prix unit.</th>
        <th align="right" style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:${PALETTE.mid};border-bottom:2px solid ${PALETTE.line};">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/**
 * Status tracker block — visual approximation of the screenshot:
 * one parcel chip on the left, four numbered tiles connected together,
 * with the active step rendered in solid brand color.
 */
function statusTracker(currentStatus) {
  if (currentStatus === "annulee") {
    return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 24px 0;background:${PALETTE.surface};border:1px solid ${PALETTE.danger};border-radius:12px;">
      <tr>
        <td style="padding:18px 20px;text-align:center;">
          <div style="display:inline-block;padding:6px 14px;background:${PALETTE.danger};color:#fff;border-radius:999px;font-weight:700;font-size:13px;letter-spacing:0.04em;">Commande annulée</div>
          <p style="margin:10px 0 0 0;font-size:13px;color:${PALETTE.mid};">Le vendeur a annulé cette commande. Si un paiement a été effectué, il sera remboursé sous quelques jours ouvrés.</p>
        </td>
      </tr>
    </table>`;
  }

  const activeIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  const cells = STATUS_STEPS.map((step, i) => {
    const isActive = i === activeIndex;
    const isPast = i < activeIndex;
    const bg = isActive ? step.color : isPast ? PALETTE.accent : PALETTE.bg;
    const circleBg = isActive ? step.color : isPast ? step.color : "#cfd2e0";
    const labelColor = isActive ? "#ffffff" : PALETTE.ink;
    const stripe = isActive ? step.color : isPast ? step.color : PALETTE.line;
    return `<td valign="top" align="center" style="padding:0 4px;width:23%;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${bg};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:${stripe};height:6px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 6px 16px 6px;">
            <div style="width:36px;height:36px;line-height:36px;border-radius:999px;background:${circleBg};color:#ffffff;font-weight:700;font-size:15px;margin:0 auto 8px auto;">${i + 1}</div>
            <div style="font-size:12px;font-weight:700;color:${labelColor};line-height:1.3;">${escape(step.label)}</div>
          </td>
        </tr>
      </table>
    </td>`;
  }).join("");

  return `<div style="margin:8px 0 24px 0;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td valign="top" align="center" style="width:80px;padding-right:8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="width:60px;height:60px;background:${PALETTE.primary};border-radius:999px;color:#fff;font-size:24px;line-height:60px;">📦</td>
            </tr>
            <tr>
              <td align="center" style="padding-top:6px;font-size:11px;font-weight:700;color:${PALETTE.ink};line-height:1.2;">Statut de<br/>commande</td>
            </tr>
          </table>
        </td>
        ${cells}
      </tr>
    </table>
  </div>`;
}

// ─── Public template builders ─────────────────────────────────────────────

export function verificationEmailTemplate(url) {
  return {
    subject: "Vérifiez votre adresse e-mail — Agora",
    html: layout({
      preheader: "Confirmez votre adresse pour activer votre compte Agora.",
      title: "Bienvenue sur Agora 🎉",
      intro:
        "Plus qu'une étape : confirmez votre adresse e-mail pour activer votre compte.",
      body: `
        ${button("Vérifier mon adresse e-mail", url)}
        <p style="margin:24px 0 0 0;font-size:13px;color:${PALETTE.mid};line-height:1.6;">
          Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail.
        </p>
      `,
    }),
  };
}

export function passwordResetTemplate(url) {
  return {
    subject: "Réinitialisation de votre mot de passe — Agora",
    html: layout({
      preheader: "Choisissez un nouveau mot de passe pour votre compte Agora.",
      title: "Réinitialisation du mot de passe",
      intro:
        "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
      body: `
        ${button("Réinitialiser mon mot de passe", url)}
        <p style="margin:24px 0 0 0;font-size:13px;color:${PALETTE.mid};line-height:1.6;">
          Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.
        </p>
      `,
    }),
  };
}

/**
 * Buyer receipt — sent right after a successful order.
 * @param {object} order normalized order data
 * @param {string} order.id, order.shortId, order.createdAt
 * @param {object} order.buyer { firstName, email }
 * @param {object} order.shippingAddress
 * @param {number} order.totalPrice
 * @param {Array}  order.subOrders [{ shopName, total, items: [{ name, quantity, unitPrice }] }]
 */
export function orderReceiptTemplate(order) {
  const buyerFirst = order.buyer?.firstName ? `, ${escape(order.buyer.firstName)}` : "";
  const orderUrl = `${frontend()}/compte/commandes/${order.id}`;
  const addr = order.shippingAddress || {};

  const subBlocks = order.subOrders
    .map(
      (sub) => `
        <div style="margin:24px 0 8px 0;">
          <div style="display:inline-block;padding:4px 10px;background:${PALETTE.accent};color:${PALETTE.primary};font-size:12px;font-weight:700;border-radius:999px;letter-spacing:0.02em;">${escape(sub.shopName || "Boutique")}</div>
        </div>
        ${itemsTable(sub.items)}
        <div style="text-align:right;font-size:14px;color:${PALETTE.ink};">
          Sous-total boutique : <strong>${formatPrice(sub.total)}</strong>
        </div>
      `
    )
    .join("");

  const fullAddress =
    [addr.street, [addr.postalCode, addr.city].filter(Boolean).join(" "), addr.country]
      .filter(Boolean)
      .map(escape)
      .join("<br/>") || "—";

  return {
    subject: `Confirmation de votre commande #${order.shortId} — Agora`,
    html: layout({
      preheader: `Merci pour votre commande #${order.shortId} — récapitulatif à l'intérieur.`,
      title: `Merci pour votre commande${buyerFirst} !`,
      intro:
        "Votre paiement a bien été reçu. Voici le récapitulatif de votre commande. Vous recevrez d'autres e-mails à chaque étape de sa préparation.",
      body: `
        ${infoCard([
          ["N° de commande", `<strong>#${escape(order.shortId)}</strong>`],
          ["Date", escape(formatDate(order.createdAt))],
          ["Adresse de livraison", fullAddress],
        ])}
        ${subBlocks}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:16px;border-top:2px solid ${PALETTE.ink};">
          <tr>
            <td style="padding:14px 8px 4px 8px;font-size:16px;color:${PALETTE.ink};">Total payé</td>
            <td style="padding:14px 8px 4px 8px;font-size:18px;color:${PALETTE.ink};text-align:right;font-weight:700;">${formatPrice(order.totalPrice)}</td>
          </tr>
        </table>
        <div style="margin-top:24px;text-align:center;">
          ${button("Voir ma commande", orderUrl)}
        </div>
        <p style="margin:24px 0 0 0;font-size:13px;color:${PALETTE.mid};line-height:1.6;">
          Une question ? Répondez simplement à cet e-mail, nous sommes là pour vous aider.
        </p>
      `,
    }),
  };
}

/**
 * Seller notification — sent when a new sub-order lands on their shop.
 * Intentionally short; details live in the dashboard.
 */
export function sellerNewOrderTemplate({ sellerFirstName, shopName, subOrder, orderShortId }) {
  const url = `${frontend()}/vendeur/commandes/${subOrder.id}`;
  const greeting = sellerFirstName ? `, ${escape(sellerFirstName)}` : "";
  const itemCount = (subOrder.items || []).reduce(
    (sum, it) => sum + Number(it.quantity || 0),
    0
  );

  return {
    subject: `Nouvelle commande sur ${shopName} — Agora`,
    html: layout({
      preheader: `Une nouvelle commande vient d'être passée sur ${shopName}.`,
      title: `Nouvelle commande reçue${greeting}`,
      intro: `Une nouvelle commande vient d'être passée sur votre boutique <strong>${escape(shopName)}</strong>. Connectez-vous à votre tableau de bord pour la préparer.`,
      body: `
        ${infoCard([
          ["Référence commande", `<strong>#${escape(orderShortId)}</strong>`],
          ["Articles à préparer", `${itemCount}`],
          ["Montant", `<strong>${formatPrice(subOrder.total)}</strong>`],
        ])}
        <div style="margin-top:16px;text-align:center;">
          ${button("Voir la commande", url, PALETTE.gold)}
        </div>
        <p style="margin:24px 0 0 0;font-size:13px;color:${PALETTE.mid};line-height:1.6;">
          Astuce : pensez à mettre à jour le statut au fur et à mesure de la préparation — l'acheteur reçoit automatiquement une notification à chaque étape.
        </p>
      `,
      footerNote: "Vous recevez cet e-mail en tant que vendeur Agora.",
    }),
  };
}

/**
 * Status update — sent to the buyer whenever a sub-order's status changes.
 */
export function orderStatusUpdateTemplate({ buyerFirstName, orderId, orderShortId, shopName, status }) {
  const url = `${frontend()}/compte/commandes/${orderId}`;
  const statusLabel = STATUS_LABELS[status] || status;
  const greeting = buyerFirstName ? `${escape(buyerFirstName)}, ` : "";

  let intro;
  if (status === "annulee") {
    intro = `${greeting}le vendeur a annulé une partie de votre commande${shopName ? ` chez <strong>${escape(shopName)}</strong>` : ""}. Plus de détails ci-dessous.`;
  } else if (status === "livree") {
    intro = `${greeting}bonne nouvelle ! Votre commande${shopName ? ` chez <strong>${escape(shopName)}</strong>` : ""} a été livrée. Nous espérons que tout est conforme à vos attentes.`;
  } else {
    intro = `${greeting}le statut de votre commande${shopName ? ` chez <strong>${escape(shopName)}</strong>` : ""} a été mis à jour.`;
  }

  return {
    subject: `Mise à jour de votre commande #${orderShortId} — ${statusLabel}`,
    html: layout({
      preheader: `Votre commande #${orderShortId} est maintenant : ${statusLabel}`,
      title: `Votre commande est <span style="color:${PALETTE.primary};">${escape(statusLabel)}</span>`,
      intro,
      body: `
        ${statusTracker(status)}
        ${infoCard([
          ["N° de commande", `<strong>#${escape(orderShortId)}</strong>`],
          ...(shopName ? [["Boutique", escape(shopName)]] : []),
          ["Nouveau statut", `<strong style="color:${PALETTE.primary};">${escape(statusLabel)}</strong>`],
        ])}
        <div style="margin-top:8px;text-align:center;">
          ${button("Suivre ma commande", url)}
        </div>
      `,
    }),
  };
}
