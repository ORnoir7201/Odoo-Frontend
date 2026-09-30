# Frontend Odoo (React + Vite)

Interface qui affiche et crée des contacts en parlant uniquement au backend
intermédiaire (jamais directement à Odoo).

## Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── clients.js         # seul fichier qui connaît l'URL du backend
│   ├── components/
│   │   ├── ClientForm.jsx     # formulaire de création
│   │   └── ClientsTable.jsx   # tableau d'affichage
│   ├── pages/
│   │   └── ClientsPage.jsx    # assemble form + tableau + logique
│   ├── App.jsx
│   ├── App.css                # tous les styles
│   └── main.jsx
├── .env.example
└── package.json
```

## Installation

```bash
cd frontend
npm install
```

## Configuration

```bash
cp .env.example .env
```

Par défaut, `.env` pointe vers `http://localhost:4000/api` — l'adresse du
backend intermédiaire en local. Modifie `VITE_API_URL` si ton backend tourne
ailleurs.

## Prérequis

**Le backend doit déjà tourner** (voir le dossier `backend/`, `npm run dev`)
avant de lancer le frontend, sinon la page affichera une erreur de chargement.

## Lancer le frontend

```bash
npm run dev
```

Puis ouvrir l'URL affichée dans le terminal (en général `http://localhost:5173`).

## Ce que tu dois voir

- Un formulaire "Nouveau contact" (nom, email, téléphone)
- Un tableau "Contacts enregistrés" listant les contacts venant d'Odoo
- Ajouter un contact via le formulaire doit le faire apparaître dans le
  tableau juste après, et dans Odoo directement (menu Contacts)

code pour ajouter la description dans les pages de détails 
<td>{line.product_id ? line.product_id[1] : '—'}</td>
                        <td>{line.name || '—'}</td>