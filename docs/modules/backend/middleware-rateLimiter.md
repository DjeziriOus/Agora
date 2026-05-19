# Module : `backend/middleware/rateLimiter.js`

## 1. Objectifs du module

Définir des **limiteurs de débit** (rate limiters) pour les routes sensibles, afin d'éviter les abus
(spam, brute force).

Aujourd'hui un seul limiteur est défini (`resendLimiter`) pour le renvoi d'e-mail de vérification.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express-rate-limit` (npm) — middleware Express de rate limiting

### Modules qui utilisent ce module

- `backend/routes/authRoutes.js` — utilise `resendLimiter` sur `POST /api/account/resend-verification`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Export | Type | Configuration |
|--------|------|---------------|
| `resendLimiter` | `Middleware` | 3 requêtes max par IP toutes les 5 minutes |

Si la limite est dépassée, le middleware renvoie :

```json
HTTP 429 Too Many Requests
{ "error": "Trop de tentatives, veuillez réessayer plus tard." }
```

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pourquoi 3 / 5 min ?

Envoyer un email de vérification a un **coût** (quota Gmail API) et un **risque** (spam vers une boîte qui n'est pas à l'utilisateur). 3 essais en 5 minutes est suffisant pour les cas légitimes (utilisateur qui n'a pas reçu l'email) sans permettre l'abus.

### Détection par IP

`express-rate-limit` utilise par défaut l'IP du client comme clé. En production derrière un proxy (Vercel, Railway), il faut que `app.set("trust proxy", 1)` soit configuré (c'est fait dans `server.js`) pour que la vraie IP soit lue depuis `x-forwarded-for`.

### Stockage en mémoire (par défaut)

Le rate limiter stocke les compteurs en mémoire de l'instance Express. Conséquences :
- ✅ Simple, pas de dépendance externe.
- ❌ Si on a plusieurs instances (load balancer), chaque instance compte indépendamment → un attaquant pourrait diviser ses requêtes entre les instances.

Pour ce projet (probablement une seule instance), c'est acceptable. Si on scale horizontalement, basculer sur le store Redis (`@express-rate-limit/redis-store`).

### Étendre ce module

D'autres routes pourraient bénéficier d'un rate limit :
- `POST /api/auth/sign-in/email` (brute force mot de passe) — mais Better Auth gère déjà ça en interne.
- `POST /api/orders` (spam de commandes) — peu probable mais possible.

Si besoin, ajouter une nouvelle const exportée ici plutôt que dans le fichier de routes, pour garder la config centralisée.
