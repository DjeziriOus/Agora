# Module : `backend/services/emailTemplates.js`

## 1. Objectifs du module

Construire les **templates HTML** des e-mails envoyés par l'application, brandés aux couleurs Agora.

Toutes les chaînes sont en **français** (le projet ne supporte que cette langue pour l'instant). Les emails sont en HTML responsive avec inline styles (parce que beaucoup de clients mail strippent le `<style>` global).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- Aucun (pure construction de strings).

### Modules qui utilisent ce module

- `backend/services/emailService.js`

## 3. Définitions de types / attributs

### Format retourné par chaque builder

```ts
{ subject: string, html: string }
```

### Palette de couleurs (`PALETTE`)

```js
{
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
  surface: "#ffffff"
}
```

Synchronisée avec `frontend/app/globals.css`.

## 4. Procédures externes

| Fonction | Signature | Quand l'utiliser |
|----------|-----------|------------------|
| `verificationEmailTemplate` | `(url: string) => {subject, html}` | À l'inscription |
| `passwordResetTemplate` | `(url: string) => {subject, html}` | Demande de reset password |
| `orderReceiptTemplate` | `(order) => {subject, html}` | Confirmation à l'acheteur après commande |
| `sellerNewOrderTemplate` | `({ sellerFirstName, shopName, subOrder, orderShortId }) => {subject, html}` | Notification au vendeur |
| `orderStatusUpdateTemplate` | `({ buyerFirstName, orderId, orderShortId, shopName, status }) => {subject, html}` | Notification de changement de statut |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Helpers internes (pas exportés)

| Helper | Rôle |
|--------|------|
| `escape(value)` | Échappe HTML (`<`, `>`, `&`, `"`, `'`) |
| `formatPrice(value)` | Formate prix en euros (`12,30 €`) |
| `formatDate(value)` | Formate date en fr-FR (`28 mai 2026`) |
| `shortOrderId(id)` | Renvoie les 8 derniers caractères en majuscules |
| `logoUrl()` | URL du logo depuis le frontend |
| `layout({ preheader, title, intro, body, footerNote })` | Wrapper HTML avec header/footer |
| `button(label, url, color?)` | Bouton CTA stylé |
| `infoCard(rows)` | Bloc d'infos clé:valeur |
| `itemsTable(items)` | Tableau d'articles avec quantité × prix unitaire |
| `statusTracker(currentStatus)` | Barre de progression visuelle (4 étapes + état annulé) |

### Pourquoi tout en inline styles ?

Beaucoup de clients mail (Outlook, Gmail mobile, Apple Mail) **strippent ou ignorent les `<style>` globaux** ou les CSS externes. Le seul moyen fiable est de mettre `style="..."` directement sur chaque balise.

C'est verbeux mais standard pour l'industrie des emails HTML.

### Échappement XSS

```js
const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
```

**TOUS** les champs dynamiques injectés dans le HTML passent par `escape()`. Sans ça, un nom de produit comme `<script>alert(1)</script>` deviendrait exécutable côté client mail (peu probable mais c'est la règle).

### `statusTracker` — état visuel

Pour les emails de changement de statut, on génère une **barre de 4 étapes** colorées :
- Cases passées : couleur de l'étape, vert + check.
- Case active : couleur saturée + numéro.
- Cases à venir : grises.

Pour le statut `annulee`, on affiche un encadré rouge spécifique.

### Le preheader

```html
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">
  ${escape(preheader)}
</span>
```

C'est le **texte de prévisualisation** affiché par les clients mail dans la liste (sous le sujet). On le cache visuellement avec une floppée de styles parce que les clients mail le rendent quand même.

### Pas de système de templates externes (Handlebars, EJS, etc.)

Le projet utilise juste des **template literals JavaScript** (backticks). Choix volontaire : pas de dépendance supplémentaire, lisibilité OK pour 5 templates.

Si le nombre de templates explose (> 20), considérer mjml-react ou react-email pour structurer.

### Différence entre `body` et `intro`

- `intro` est rendu dans un `<p>` au début (juste sous le titre, en gris secondaire).
- `body` est ce qui suit (boutons, tableaux, etc.).

C'est une convention de `layout()` — les builders doivent les fournir séparément.

### Maintenance

Si la palette de couleurs change dans `frontend/app/globals.css`, il faut **mettre à jour `PALETTE` ici aussi**. Pas de mécanisme de synchronisation automatique.
