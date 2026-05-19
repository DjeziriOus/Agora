# Module : `backend/models/Shop.js`

## 1. Objectifs du module

Schéma Mongoose de la collection `shops` — les **boutiques** des vendeurs.

Inclut :
- Validation des champs (longueurs, formats email/téléphone).
- Indexes uniques **partiels** (uniquement sur les boutiques non-supprimées).
- Hook `pre("validate")` qui génère/régénère le `slug` à partir du `name`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`
- `../models/User.js` (import side-effect pour s'assurer que `User` est enregistré avant `Shop`)

### Modules qui utilisent ce module

- `backend/models/Product.js` — `ref: "Shop"`
- `backend/services/shopService.js`, `productService.js`, `orderService.js`, `accountDeletionService.js`
- `backend/controllers/shopController.js`

## 3. Définitions de types / attributs

Voir `docs/03-modele-de-donnees.md` section `shops`. Champs principaux :

| Champ | Type | Contrainte |
|-------|------|------------|
| `name` | string | 2-50 caractères, unique partiel |
| `slug` | string | unique partiel, auto-généré |
| `description` | string | max 1000 |
| `contactEmail` | string | regex email ou vide |
| `contactPhone` | string | regex téléphone ou vide |
| `contactAddress` | string | max 200 |
| `status` | enum | active / inactive / pending |
| `owner` | ObjectId (User) | requis, unique partiel |
| `logo` | `{ url, publicId }` | image Cloudinary |
| `banner` | `{ url, publicId }` | image Cloudinary |
| `isDeleted` | boolean | soft delete |

## 4. Procédures externes

- `default export` — la classe Mongoose `Shop`

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Indexes partiels uniques

```js
shopSchema.index(
  { owner: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
```

Idem pour `slug` et `name`. **Pourquoi partiel ?** Pour permettre à un vendeur de :
1. Créer une boutique « Mon Shop ».
2. La supprimer (soft delete : `isDeleted: true`).
3. En recréer une autre avec le même nom — l'unicité ne s'applique plus à la version supprimée.

L'unicité sur `name` utilise aussi une `collation: { locale: "en", strength: 2 }` pour être case-insensitive (« Mon Shop » et « MON SHOP » sont identiques).

### Hook `pre("validate")` pour le slug

```js
shopSchema.pre("validate", async function () {
  if (this.isModified("name")) {
    const baseSlug = this.name
      .toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Gestion collision : append -1, -2, ...
    let currentSlug = baseSlug;
    let counter = 1;
    while (!isUnique) {
      const existingShop = await Shop.findOne({
        slug: currentSlug,
        isDeleted: false,
        _id: { $ne: this._id },
      });
      if (existingShop) {
        currentSlug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }
    this.slug = currentSlug;
  }
});
```

À chaque sauvegarde où `name` a changé, on régénère le slug, et on s'assure qu'il est unique en ajoutant `-1`, `-2`, etc. en cas de collision avec une autre boutique active.

**Cas non géré** : un user qui POST plusieurs shops simultanément avec le même nom pourrait potentiellement obtenir le même slug (race condition entre la lecture et l'écriture). En pratique, l'index unique partial rattrape ça → erreur 409 propre.

### `default export` avec garde

```js
export default mongoose.models.Shop || mongoose.model("Shop", shopSchema);
```

`mongoose.models.Shop ||` empêche l'erreur « OverwriteModelError » si le module est importé deux fois (peut arriver avec hot-reload en dev).

### Validators custom

```js
contactEmail: {
  validate: {
    validator: (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: "Invalid email format",
  },
}
```

Email vide accepté (champ optionnel), sinon doit ressembler à un email. Même pattern pour `contactPhone`.
