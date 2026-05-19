# Module : `frontend/src/components/ui/` (composants shadcn / Radix)

## 🎯 De quoi s'agit-il ?

Ce dossier contient **~50 fichiers** qui sont des wrappers stylisés autour des primitives de [Radix UI](https://www.radix-ui.com), suivant le pattern [shadcn/ui](https://ui.shadcn.com).

**Ce ne sont PAS des dépendances classiques** : les composants ont été **copiés dans le projet** (via la CLI shadcn) pour être customisables. C'est une approche « ownership over abstraction » : on possède le code, on peut le modifier librement.

⚠️ **Ce sont des composants génériques** (boutons, dialogues, dropdowns, etc.). Ils ne contiennent pas de logique métier Agora. Les modifier en profondeur casserait potentiellement plein d'autres composants qui s'en servent.

## 📋 Liste indicative des wrappers présents

Composants Radix wrappés :
- `accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`
- `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`
- `dialog`, `drawer`, `dropdown-menu`, `empty`, `field`, `form`, `hover-card`
- `input`, `input-group`, `input-otp`, `item`, `kbd`, `label`, `menubar`, `navigation-menu`
- `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`
- `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

(Plus quelques fichiers `* copy.tsx` qui sont des doublons à nettoyer.)

## 🔑 Composants UI les plus utilisés dans le projet

| Composant | Utilisé pour |
|-----------|--------------|
| `Button` | Tous les boutons d'action (CTA, formulaires) |
| `Dialog` | Modales de confirmation (suppression, etc.) |
| `Card` (`CardHeader`, `CardContent`, etc.) | Conteneurs principaux (cards de compte, dashboard) |
| `Input`, `Label`, `Textarea` | Formulaires (login, register, édition produit) |
| `Select`, `DropdownMenu` | Sélecteurs (catégorie, statut, etc.) |
| `Tabs` | Onglets (page compte, page vendeur) |
| `Toast` (via `sonner`) | Notifications (succès, erreur) |
| `Avatar` | Affichage photo de profil |
| `Skeleton` | Placeholders de chargement |
| `Command` | Autocomplete de la Navbar |

## ⚙️ Comment ils sont utilisés

```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Ouvrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Titre</DialogTitle>
    {/* ... */}
  </DialogContent>
</Dialog>
```

L'API est celle de Radix UI (très complète, accessible WAI-ARIA). Le style vient de Tailwind, customisé dans chaque fichier.

## 🎨 Customisation Agora

Les wrappers shadcn par défaut utilisent des classes Tailwind « neutres ». Pour matcher l'identité visuelle Agora, les fichiers ont été légèrement modifiés pour utiliser les variables CSS personnalisées :

```tsx
className="bg-[var(--agora-primary)] text-white hover:bg-[var(--agora-primary-hover)]"
```

(Au lieu de `bg-primary` qui pointait vers une couleur shadcn par défaut.)

Les **variables CSS Agora** sont définies dans `frontend/app/globals.css`.

## 🚫 Pourquoi pas de doc par composant ?

Parce que :
1. Ce sont des composants **standards** (shadcn / Radix) dont la documentation existe déjà sur [ui.shadcn.com](https://ui.shadcn.com).
2. On ne les modifie pas significativement — juste le style.
3. Documenter chaque wrapper individuellement n'apporterait rien (équivalent : « le Button affiche un bouton »).

Si tu veux comprendre le comportement d'un wrapper précis, regarde :
- Sa source dans `src/components/ui/<nom>.tsx`
- La doc Radix correspondante : par exemple [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)

## ⚠️ Fichiers en double à nettoyer

Plusieurs fichiers existent en double avec un suffixe « copy » :
- `accordion copy.tsx`
- `button copy.tsx`
- `context-menu copy.tsx`

Ce sont des artefacts (probablement des copies Windows accidentelles). À supprimer dès qu'on confirme qu'ils ne sont importés nulle part.

## 🔧 Mise à jour shadcn

Si on veut récupérer une nouvelle version d'un wrapper :

```bash
npx shadcn@latest add button   # ajoute / remplace src/components/ui/button.tsx
```

⚠️ Attention : ça **écrase** les modifications locales du composant. Sauvegarder avant.
