# Backend intermédiaire Odoo

Petit serveur Node.js/Express qui sert d'intermédiaire sécurisé entre le frontend
et l'instance Odoo. Il est le seul composant à connaître les identifiants Odoo.

## Structure

```
backend/
├── src/
│   ├── config/
│   │   └── odoo.config.js       # lit les variables d'environnement
│   ├── services/
│   │   └── odooClient.js        # seul fichier qui parle en XML-RPC à Odoo
│   ├── controllers/
│   │   └── clients.controller.js
│   ├── routes/
│   │   └── clients.routes.js
│   └── app.js                   # point d'entrée du serveur
├── .env.example                 # modèle à copier en .env
└── package.json
```

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copier le fichier modèle :
   ```bash
   cp .env.example .env
   ```
2. Ouvrir `.env` et remplir avec les vraies infos de votre Odoo :
   - `ODOO_URL` : ex. `http://africanumerik.com`
   - `ODOO_PORT` : généralement `8069`
   - `ODOO_DB` : nom exact de la base de données Odoo
   - `ODOO_USERNAME` : login du compte technique
   - `ODOO_API_KEY` : clé API générée dans Odoo
     (Odoo > icône profil > "Préférences" > onglet "Sécurité du compte"
     > section "Clés API" > "Nouvelle clé API")

## Lancer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:4000` (modifiable via `PORT` dans `.env`).

## Tester que ça fonctionne

1. Vérifier que le serveur tourne :
   ```
   GET http://localhost:4000/api/health
   ```

2. Tester la connexion réelle à Odoo (liste des contacts) :
   ```
   GET http://localhost:4000/api/clients
   ```
   Si tout est bien configuré, tu dois recevoir une liste de contacts en JSON.

   Si tu obtiens une erreur d'authentification, vérifie en priorité :
   - le nom de la base de données (`ODOO_DB`)
   - que la clé API n'a pas expiré ou été révoquée
   - que le compte technique a bien les droits d'accès aux contacts

3. Créer un contact de test :
   ```
   POST http://localhost:4000/api/clients
   Content-Type: application/json

   {
     "name": "Client Test",
     "email": "test@example.com",
     "phone": "+226 00 00 00 00"
   }
   ```
