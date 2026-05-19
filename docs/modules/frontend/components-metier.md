# Modules : `frontend/src/components/` (composants métier)

Ce document décrit les **composants métier** spécifiques au projet Agora (par opposition aux wrappers shadcn génériques, documentés séparément).

## 📋 Liste des composants

| Composant | Rôle |
|-----------|------|
| `Navbar.tsx` | Barre de navigation principale |
| `Footer.tsx` | Pied de page |
| `VerificationBanner.tsx` | Bandeau d'alerte « email non vérifié » |
| `EmailVerificationAlert.tsx` | Variante de l'alerte verification |
| `VendorSidebar.tsx` | Sidebar latérale du dashboard vendeur |
| `ProductCard.tsx` | Carte produit (grid + list view) |
| `StarRating.tsx` | Affichage de notes en étoiles |
| `AgoraBadge.tsx` | Pastille colorée (statut, catégorie) |
| `Pagination.tsx` | Pagination avec ellipses |
| `OrderStepBar.tsx` | Barre de progression checkout (Panier → Livraison → Paiement → Confirmation) |
| `EmptyState.tsx` | Affichage « rien à voir ici » avec icône et CTA |
| `SkeletonCard.tsx` | Placeholder de chargement (skeleton produit) |
| `SellerShopRequiredState.tsx` | Affichage pour vendeur sans boutique |
| `AccountDangerZoneCard.tsx` | Carte de suppression de compte |
| `AccountPasswordSettingsCard.tsx` | Changement mot de passe |
| `AccountProfilePictureCard.tsx` | Photo de profil (upload/delete) |
| `AccountProfileSettingsCard.tsx` | Édition prénom/nom/etc. |
| `landing/HeroIllustration.tsx` | Illustration SVG du hero |
| `landing/Reveal.tsx` | Animation au scroll (fade in) |
| `landing/CountUp.tsx` | Animation de compteur (de 0 à N) |

## 🔑 Composants les plus importants

### `Navbar.tsx`

**Rôle** : Barre de nav principale, contient logo, recherche, panier, menu utilisateur.

**Comportements** :
- Logo cliquable → `/`.
- Champ de recherche (avec dropdown autocomplete via Command de shadcn).
- Bouton panier avec badge (compteur d'items) — masqué pour les vendeurs.
- Menu dropdown utilisateur si connecté (Mon compte / Mes commandes / Déconnexion).
- Bouton « Connexion » sinon.
- Affiche un point rouge sur l'avatar si l'email n'est pas vérifié.

**Dépendances** :
- `useAuth()` pour l'état user
- `useCart()` (du hook moderne) pour le compteur
- `useProducts({ q: search })` pour l'autocomplete

### `ProductCard.tsx`

**Rôle** : Affiche un produit dans une grille (vue `grid`) ou en ligne (vue `list`).

**Props** :
```ts
{
  product: Product,
  viewMode: "grid" | "list",
  className?: string,
}
```

**Comportements** :
- Image principale (premier élément de `product.images`).
- Badge catégorie.
- Note (StarRating) avec nombre d'avis.
- Lien vers la boutique.
- Prix (avec « À partir de » si `hasMultiplePrices`).
- Overlay « Rupture de stock » si `!product.inStock`.
- Bouton « Ajouter au panier » (masqué pour les vendeurs).
- Bouton « favoris » (local state seulement, pas connecté au backend).

**Notes** :
- Le bouton d'ajout au panier sélectionne automatiquement la première variante active.
- Animation « Ajouté » avec checkmark de 2 secondes après ajout réussi.

### `VendorSidebar.tsx`

**Rôle** : Sidebar latérale dans `/vendeur/*`.

**Comportements** :
- Affiche le nom de la boutique en haut.
- Liens : Dashboard, Mes produits, Stock, Commandes, Boutique, Paramètres.
- Si pas de boutique → seuls « Boutique » et « Paramètres » sont visibles.
- Badge d'alerte stock bas sur le lien « Mes produits ».
- Toggle collapse/expand (responsive).
- Bouton déconnexion en bas.

### `VerificationBanner.tsx`

**Rôle** : Bandeau jaune en haut de page « Veuillez vérifier votre email ».

**Comportements** :
- Affiché uniquement si user connecté + email non vérifié + `requireEmailVerification` actif.
- Bouton « Renvoyer le lien » → appelle `resendVerification()` de `useAuth`.
- Persiste à la fermeture (utilise sessionStorage).

### `OrderStepBar.tsx`

**Rôle** : Barre de progression visuelle du tunnel d'achat.

**Props** :
```ts
{
  currentStep: 1 | 2 | 3 | 4,
  className?: string,
}
```

4 étapes : Panier → Livraison → Paiement → Confirmation.

### `EmptyState.tsx`

**Rôle** : Affichage standardisé « rien à voir ici » avec une icône, un titre, une description, et un CTA optionnel.

**Variants** : `products`, `search`, `cart`, `orders`, `store` (chacun avec icône / textes par défaut). On peut aussi tout customiser via props.

### `Pagination.tsx`

**Rôle** : Composant de pagination réutilisable.

**Algorithme** : `getPageSlots(current, total)` génère un tableau de numéros avec des `"…"` quand il y a trop de pages :

```
total=20, current=5  →  [1, "…", 4, 5, 6, "…", 20]
total=5, current=3   →  [1, 2, 3, 4, 5]
```

Boutons : première / précédente / numéros / suivante / dernière.

Scroll automatique en haut de page au changement.

### `SkeletonCard.tsx` + `SkeletonProductGrid`

**Rôle** : Placeholders de chargement (skeletons animés) qui correspondent à la forme d'une `ProductCard`. Affichés pendant les `isLoading` des hooks React Query.

### `landing/Reveal.tsx`

**Rôle** : Wrapper qui fait apparaître son contenu en fondu quand il entre dans le viewport.

Utilise `useInView` (de `src/hooks/`) pour détecter l'apparition.

```tsx
<Reveal delay={200}>
  <h2>Mon titre</h2>
</Reveal>
```

### `landing/CountUp.tsx`

**Rôle** : Anime un compteur de 0 jusqu'à une valeur cible.

```tsx
<CountUp end={1500} suffix="+" />
```

### `AccountProfilePictureCard.tsx`

**Rôle** : Card de gestion de la photo de profil dans `/compte` et `/vendeur/parametres`.

**Comportements** :
- Upload via `<input type="file">`.
- Preview avant envoi.
- Suppression via API.
- Fallback : initiales du user dans un cercle coloré si pas d'image.

## 📐 Conventions

Tous ces composants utilisent :
- `cn()` pour merger les classes Tailwind.
- Les variables CSS Agora (`var(--agora-primary)`, etc.) définies dans `globals.css`.
- Le format `function ComponentName({ props }: Props)` avec export nommé.
- `"use client"` en haut (la plupart sont client-side).

## 🎨 Composants `ui/` (shadcn) — utilisés mais pas documentés individuellement

Le dossier `src/components/ui/` contient ~50 wrappers shadcn (button, dialog, dropdown, select, etc.). Voir `components-ui.md` pour la liste et l'usage général.
