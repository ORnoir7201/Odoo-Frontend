require('dotenv').config();

// Ce fichier centralise toutes les infos de connexion à Odoo.
// Si un jour l'URL ou la clé change, on modifie UNIQUEMENT le .env,
// jamais ce fichier ni le reste du code.

module.exports = {
  url: process.env.ODOO_URL,
  port: process.env.ODOO_PORT,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USERNAME,
  apiKey: process.env.ODOO_API_KEY,
};
