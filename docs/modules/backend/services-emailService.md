# Module : `backend/services/emailService.js`

## 1. Objectifs du module

Envoyer tous les e-mails de l'application via **l'API Gmail HTTP** (et non SMTP).

5 types d'e-mails sont supportés :
- Vérification d'e-mail (à l'inscription)
- Reset de mot de passe
- Reçu de commande (à l'acheteur)
- Notification de nouvelle commande (au vendeur)
- Mise à jour de statut de commande (à l'acheteur)

Le module construit les e-mails en MIME et les envoie via OAuth 2 (refresh token Google).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `googleapis` — SDK Google officiel
- `./emailTemplates.js` — templates HTML brandés

### Modules qui utilisent ce module

- `backend/auth.js` — `sendVerificationEmail`, `sendPasswordResetEmail` (hooks Better Auth)
- `backend/services/orderService.js` — `sendOrderReceiptEmail`, `sendSellerNewOrderEmail`, `sendOrderStatusUpdateEmail`

## 3. Définitions de types / attributs

Aucun export de type. Les builders de templates exposent leur propre forme dans `emailTemplates.js`.

## 4. Procédures externes

| Fonction | Async/Sync | Erreur si échec ? |
|----------|-----------|--------------------|
| `sendMail({ to, subject, html, from? })` | Async | OUI (throw) |
| `sendVerificationEmail(email, url)` | Async | OUI |
| `sendPasswordResetEmail(email, url)` | Async | OUI |
| `sendOrderReceiptEmail(buyerEmail, order)` | Promise (fire&forget) | NON (loggé) |
| `sendSellerNewOrderEmail(sellerEmail, payload)` | Promise (fire&forget) | NON (loggé) |
| `sendOrderStatusUpdateEmail(buyerEmail, payload)` | Promise (fire&forget) | NON (loggé) |

## 5. Variables externes

Aucune (que des fonctions).

## 6. Notes d'implémentation

### Pourquoi l'API HTTP plutôt que SMTP ?

Beaucoup d'hébergeurs (Railway, Vercel) **bloquent le port 25 sortant** pour éviter le spam. L'API Gmail passe par HTTPS (port 443), donc fonctionne partout.

### Auth via OAuth 2 + refresh token

```js
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
cachedGmail = google.gmail({ version: "v1", auth: oAuth2Client });
```

Le client Google génère automatiquement un access_token à partir du refresh_token. Pas besoin de le stocker — le SDK le rafraîchit en interne quand il expire.

**Pour obtenir le refresh_token initial** : utiliser l'OAuth Playground de Google une fois (scope `https://mail.google.com/`).

### Caching du client Gmail

```js
let cachedGmail = null;
function getGmailClient() {
  if (cachedGmail) return cachedGmail;
  // ... création
  cachedGmail = google.gmail(...);
  return cachedGmail;
}
```

Le client est créé au premier appel et réutilisé. Évite de recréer la connexion OAuth à chaque email.

### Construction du message MIME

```js
function buildRawMessage({ to, subject, html, from }) {
  const message = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,    // ← RFC 2047 pour accents
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf-8").toString("base64"),
  ].join("\r\n");

  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
```

L'API Gmail veut un message MIME complet, encodé en **base64url** (`-` et `_` au lieu de `+` et `/`, et padding `=` supprimé). C'est subtil — la moindre erreur d'encodage fait échouer l'envoi.

`encodeSubject(subject)` encode le sujet en RFC 2047 (`=?UTF-8?B?...?=`) pour que les accents s'affichent correctement dans les clients mail (Gmail, Outlook, Apple Mail).

### `sendMailQuiet` — fire-and-forget

```js
function sendMailQuiet(payload, label = "email") {
  return sendMail(payload).catch((err) => {
    console.error(`[emailService] failed ...`, err?.message || err);
  });
}
```

Pour les emails non critiques (notifications de commande), on utilise ce wrapper qui catch les erreurs et les loggue sans les propager. Conséquence : si l'envoi échoue, le flux métier (création de commande, changement de statut) continue normalement.

### `sendMail` vs `sendMailQuiet` — quand utiliser quoi ?

- `sendMail` (lance une erreur) : pour les emails **critiques** où l'échec doit interrompre le flux. Exemple : vérification d'email (si on n'envoie pas, l'user ne peut pas activer son compte).
- `sendMailQuiet` (silencieux) : pour les emails **best-effort** où l'échec ne doit PAS bloquer. Exemple : notification au vendeur (la commande existe quand même, le vendeur la verra dans son dashboard).

### Variables d'environnement requises

- `EMAIL_FROM` — adresse expéditeur (ex : `noreply.agora.marketplace@gmail.com`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN` — scope `https://mail.google.com/`

Si l'une manque → erreur au premier `sendMail`.

### Limites Gmail

L'API Gmail a un quota : ~1 milliard de quotas-units par jour pour un compte gratuit, mais un envoi simple coûte 100 quota-units. En pratique : ~10 millions d'emails / jour pour un compte gratuit. Largement suffisant pour Agora.
