# Authentification JWT

## Configuration

Ajoutez dans votre fichier `.env` :

```env
JWT_SECRET=votre-secret-jwt-super-securise-changez-en-production
```

Par défaut, si `JWT_SECRET` n'est pas défini, la clé `your-secret-key-change-in-production` sera utilisée (⚠️ **NE PAS utiliser en production**).

---

## Endpoint de Login

**POST** `/api/auth/login`

**Body (JSON) :**
```json
{
  "email": "contact@ma-societe.fr",
  "password": "motdepasse123"
}
```

**Réponse (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "contact@ma-societe.fr",
    "role": "CLIENT",
    "avatar": null,
    "telephone": null
  }
}
```

**Erreur (401) :**
```json
{
  "statusCode": 401,
  "message": "Email ou mot de passe incorrect"
}
```

---

## Utilisation du Token

### Dans les requêtes HTTP

Ajoutez le header `Authorization` avec le token :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Exemple avec cURL

```bash
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Exemple avec Postman

1. Allez dans l'onglet **Authorization**
2. Sélectionnez **Type: Bearer Token**
3. Collez votre token dans le champ **Token**

---

## Protection des Routes

Par défaut, **toutes les routes sont protégées** par le guard JWT.

### Routes publiques

Pour rendre une route publique, utilisez le décorateur `@Public()` :

```typescript
import { Public } from '../common/decorators/public.decorator';

@Public()
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### Routes protégées

Les routes sans `@Public()` nécessitent un token JWT valide. Si le token est manquant ou invalide, vous recevrez une erreur **401 Unauthorized**.

---

## Récupérer l'utilisateur connecté

Dans un contrôleur, utilisez le décorateur `@CurrentUser()` :

```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Get('profile')
getProfile(@CurrentUser() user) {
  return user;
}
```

L'objet `user` contient :
- `id`: number
- `email`: string
- `role`: Role (CLIENT | EMPLOYER | ADMIN)
- `avatar`: string | null
- `telephone`: string | null

---

## Durée de validité du Token

Le token JWT expire après **24 heures** par défaut. Après expiration, l'utilisateur doit se reconnecter.

---

## Routes publiques actuelles

- `POST /api/auth/login` - Connexion

Toutes les autres routes nécessitent une authentification.
