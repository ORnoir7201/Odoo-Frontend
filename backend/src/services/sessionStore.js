const crypto = require('crypto');

/**
 * Garde en mémoire, côté serveur uniquement, les identifiants Odoo de
 * chaque personne connectée le temps de sa session. Ces identifiants ne
 * sont JAMAIS renvoyés au navigateur — seul un identifiant de session
 * aléatoire (sessionId) est transmis au frontend, via le jeton JWT.
 *
 * Limite à connaître : ces sessions vivent en mémoire du processus Node.
 * Si le backend redémarre, tout le monde doit se reconnecter — acceptable
 * pour un outil interne, mais à garder en tête.
 */
const sessions = new Map();

/**
 * Crée une nouvelle session et renvoie son identifiant unique.
 * @param {{ uid: number, email: string, password: string }} data
 * @returns {string} sessionId
 */
function createSession({ uid, email, password, companyId, companyIds }) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { uid, email, password, companyId, companyIds, createdAt: Date.now() });
  return sessionId;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function updateSession(sessionId, changes) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  Object.assign(session, changes);
  return session;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  deleteSession,
};