const jwt = require('jsonwebtoken');
const odooClient = require('../services/odooClient');
const sessionStore = require('../services/sessionStore');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '8h';

/**
 * POST /api/auth/login
 * Body attendu : { email, password }
 *
 * Vérifie l'email/mot de passe auprès d'Odoo. Si valides, crée une session
 * en mémoire côté serveur (contenant le uid + le mot de passe, nécessaires
 * pour agir plus tard EN TANT que cette personne), et renvoie un jeton qui
 * pointe vers cette session — jamais les identifiants eux-mêmes.
 */
async function login(req, res) {
  try {
    const { email, password, db } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const uid = await odooClient.verifyUserCredentials(email, password, db);

    if (!uid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const tempSession = { uid, password, dbName: db };
    const users = await odooClient.execute(
      'res.users',
      'read',
      [[uid]],
      { fields: ['name', 'company_id', 'company_ids'] },
      tempSession
    );
    const userInfo = users[0];

    const sessionId = sessionStore.createSession({
      uid,
      email,
      password,
      dbName: db,
      companyId: userInfo.company_id ? userInfo.company_id[0] : null,
      companyIds: userInfo.company_ids || [],
    });

    const token = jwt.sign({ sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ success: true, token, email, name: userInfo.name });
  } catch (error) {
    console.error('Erreur login:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des identifiants',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/logout
 * Supprime la session côté serveur (le jeton devient inutilisable ensuite,
 * même s'il n'a pas techniquement expiré).
 */
function logout(req, res) {
  if (req.odooSession && req.sessionId) {
    sessionStore.deleteSession(req.sessionId);
  }
  res.json({ success: true });
}

/**
 * GET /api/auth/databases
 * Liste les bases de données disponibles sur ce serveur Odoo (public,
 * comme sur l'écran de connexion natif d'Odoo).
 */
async function getDatabases(req, res) {
  try {
    const databases = await odooClient.listDatabases();
    res.json({ success: true, data: databases });
  } catch (error) {
    console.error('Erreur getDatabases:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer la liste des bases (elle est peut-être désactivée sur ce serveur)',
      error: error.message,
    });
  }
}

module.exports = {
  login,
  logout,
  getDatabases,
};