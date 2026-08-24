const xmlrpc = require('xmlrpc');
const odooConfig = require('../config/odoo.config');

/**
 * Ce fichier est LE SEUL endroit du projet qui parle directement à Odoo.
 *
 * Deux façons d'appeler Odoo cohabitent ici :
 * 1. execute(...)          -> utilise les identifiants de LA PERSONNE CONNECTÉE
 *                             (Option B : chaque action est faite avec son propre
 *                             compte, ses propres droits, sa propre traçabilité)
 * 2. executeAsService(...) -> utilise le compte technique du .env, réservé aux
 *                             scripts internes (ex: explore-fields.js)
 */

const commonClient = xmlrpc.createClient({
  host: odooConfig.url.replace(/^https?:\/\//, ''),
  port: odooConfig.port,
  path: '/xmlrpc/2/common',
});

const objectClient = xmlrpc.createClient({
  host: odooConfig.url.replace(/^https?:\/\//, ''),
  port: odooConfig.port,
  path: '/xmlrpc/2/object',
});

/**
 * Vérifie des identifiants Odoo (page de connexion).
 * Renvoie le uid Odoo de la personne si valides, ou `false` sinon.
 * Ne met rien en cache : sert uniquement à valider un login.
 */
function verifyUserCredentials(login, password) {
  return new Promise((resolve, reject) => {
    commonClient.methodCall('authenticate', [odooConfig.db, login, password, {}], (error, uid) => {
      if (error) {
        return reject(error);
      }
      resolve(uid || false);
    });
  });
}

/**
 * Exécute une méthode Odoo AVEC LES IDENTIFIANTS DE LA PERSONNE CONNECTÉE.
 * @param {string} model    - ex: 'res.partner'
 * @param {string} method   - ex: 'search_read', 'create', 'write', 'unlink'
 * @param {Array} args      - arguments positionnels
 * @param {Object} kwargs   - arguments nommés (fields, limit, order...)
 * @param {{ uid: number, password: string }} session - identifiants Odoo
 *        de la personne connectée (viennent de req.odooSession, posé par
 *        le middleware d'authentification)
 */
async function execute(model, method, args = [], kwargs = {}, session) {
  if (!session || !session.uid || !session.password) {
    throw new Error(
      "Session Odoo manquante : cette fonction doit être appelée avec les identifiants de l'utilisateur connecté"
    );
  }

  const finalKwargs = { ...kwargs };

  // Si la session porte une société active, on l'injecte automatiquement
  // dans le contexte — sauf si l'appelant a déjà fourni son propre contexte.
  if (session.companyId && !finalKwargs.context) {
    finalKwargs.context = {
      allowed_company_ids: session.companyIds && session.companyIds.length > 0
        ? session.companyIds
        : [session.companyId],
      company_id: session.companyId,
    };
  }

  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [odooConfig.db, session.uid, session.password, model, method, args, finalKwargs],
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
  });
}

// --- Ci-dessous : uniquement pour le compte technique (scripts internes) ---

let cachedServiceUid = null;

function authenticateService() {
  return new Promise((resolve, reject) => {
    if (cachedServiceUid) {
      return resolve(cachedServiceUid);
    }
    commonClient.methodCall(
      'authenticate',
      [odooConfig.db, odooConfig.username, odooConfig.apiKey, {}],
      (error, uid) => {
        if (error) return reject(error);
        if (!uid) {
          return reject(new Error('Échec authentification compte technique : vérifie le .env'));
        }
        cachedServiceUid = uid;
        resolve(uid);
      }
    );
  });
}

async function executeAsService(model, method, args = [], kwargs = {}) {
  const uid = await authenticateService();
  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [odooConfig.db, uid, odooConfig.apiKey, model, method, args, kwargs],
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

module.exports = {
  verifyUserCredentials,
  execute,
  executeAsService,
};