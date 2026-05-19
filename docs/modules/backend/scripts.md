# Module : `backend/scripts/`

## 1. Objectifs du module

Scripts **one-shot** lancés à la main pour des opérations exceptionnelles :
- Seed de données de démo
- Migrations de schéma quand le modèle évolue

Aucun de ces scripts n'est lancé automatiquement. Ils sont exécutés manuellement avec `node scripts/<nom>.js`.

## 2. Liste des scripts

| Fichier | Rôle |
|---------|------|
| `seed.js` | Insère des données de démo (users, shops, products) pour le développement |
| `migrate-to-variants.js` | Migration historique : convertit l'ancien modèle Product (avec `price` + `stock` à plat) vers le nouveau (avec `variants`) |
| `migrate-add-max-per-order.js` | Migration historique : ajoute le champ `maxPerOrder` aux variantes existantes |
| `move-test-to-multivendor.js` | Migration historique liée à la mise en place du multi-vendor |

## 3. Comment utiliser un script

```bash
cd backend
node scripts/seed.js
```

Le script lit `MONGO_URI` depuis `.env`, se connecte à la base, fait son travail, et termine le processus.

## 4. Notes générales

### Migrations historiques

Les 3 migrations sont **historiques** : elles ne sont plus utiles si on part d'une base vide (le schéma actuel les inclut). Elles servent à mettre à jour une base de prod existante quand le schéma change.

Une fois exécutées, on peut les laisser dans le repo comme trace, mais elles ne devraient plus jamais être relancées.

### Seed

`seed.js` est utile en dev pour avoir des données réalistes (boutiques, produits, etc.) sans devoir tout créer manuellement à chaque fresh install.

⚠️ **Ne JAMAIS lancer `seed.js` en production** : ça injecte des données factices.

### Schéma de migration recommandé

Si on ajoute de nouvelles migrations à l'avenir :
1. Nommage : `migrate-<feature>-<date>.js` pour ordonner.
2. Toujours faire un `console.log` clair de ce qui est modifié.
3. Idempotence : la migration doit pouvoir être relancée sans casser (par exemple, vérifier que le champ n'existe pas déjà avant de l'ajouter).
4. Backup recommandé avant exécution.
