# Tests API Clients

Base URL : **http://localhost:3000/api**

## 1. Démarrer le serveur

```bash
npm run start:dev
```

Vérifier que le serveur affiche : `🚀 Server running on http://localhost:3000/api`

---

## 2. Créer un client (POST)

**Endpoint :** `POST /api/clients`

**Headers :** `Content-Type: application/json`

**Body (JSON) :**
```json
{
  "email": "contact@ma-societe.fr",
  "password": "motdepasse123",
  "nomSociete": "Ma Société SARL",
  "localisation": "Paris, France"
}
```

Champs optionnels : `avatar`, `telephone`

### Avec cURL (PowerShell)

```powershell
curl -X POST http://localhost:3000/api/clients `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"contact@ma-societe.fr\",\"password\":\"motdepasse123\",\"nomSociete\":\"Ma Société SARL\",\"localisation\":\"Paris, France\"}'
```

### Avec cURL (cmd / bash)

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"contact@ma-societe.fr\",\"password\":\"motdepasse123\",\"nomSociete\":\"Ma Société SARL\",\"localisation\":\"Paris, France\"}"
```

### Réponse attendue (201)

```json
{
  "id": 1,
  "email": "contact@ma-societe.fr",
  "role": "CLIENT",
  "avatar": null,
  "telephone": null,
  "createdAt": "2025-02-19T...",
  "client": {
    "id": 1,
    "nomSociete": "Ma Société SARL",
    "localisation": "Paris, France"
  }
}
```

### Erreur : email déjà utilisé (409)

Si vous renvoyez le même body, vous devez obtenir :

```json
{
  "statusCode": 409,
  "message": "Email déjà utilisé"
}
```

---

## 3. Lister tous les clients (GET)

**Endpoint :** `GET /api/clients`

### cURL

```bash
curl http://localhost:3000/api/clients
```

### Réponse attendue (200)

```json
[
  {
    "id": 1,
    "nomSociete": "Ma Société SARL",
    "localisation": "Paris, France",
    "utilisateur": {
      "id": 1,
      "email": "contact@ma-societe.fr",
      "role": "CLIENT",
      "avatar": null,
      "telephone": null,
      "createdAt": "2025-02-19T..."
    }
  }
]
```

---

## 4. Récupérer un client par ID (GET)

**Endpoint :** `GET /api/clients/:id`

Exemple : `GET /api/clients/1`

### cURL

```bash
curl http://localhost:3000/api/clients/1
```

### Réponse attendue (200)

Même structure qu’un élément dans la liste (id, nomSociete, localisation, utilisateur).

### Erreur : client introuvable (404)

```bash
curl http://localhost:3000/api/clients/999
```

```json
{
  "statusCode": 404,
  "message": "Client #999 introuvable"
}
```

---

## 5. Validation (400)

Si un champ requis est manquant ou invalide (ex. email invalide, password &lt; 6 caractères) :

**Exemple :** mot de passe trop court

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"123\",\"nomSociete\":\"Test\",\"localisation\":\"Lyon\"}"
```

Réponse typique (400) avec `message` décrivant les erreurs de validation.

---

## Résumé des endpoints

| Méthode | URL              | Description        |
|---------|------------------|--------------------|
| POST    | /api/clients     | Créer un client    |
| GET     | /api/clients     | Liste des clients  |
| GET     | /api/clients/:id | Détail d’un client |
