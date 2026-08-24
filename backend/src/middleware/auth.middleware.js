const jwt = require('jsonwebtoken');
const sessionStore = require('../services/sessionStore');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware Express à placer devant toute route protégée.
 * 1. Vérifie que le jeton JWT est présent et valide
 * 2. Retrouve la session correspondante (créée au login), qui contient
 *    les VRAIS identifiants Odoo de la personne connectée
 * 3. Pose req.odooSession = { uid, password, email } pour que les
 *    controllers puissent agir avec CES identifiants
 *
 * Si le jeton est invalide OU si la session a disparu (ex: redémarrage
 * du backend), on renvoie 401 et on demande de se reconnecter.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }

  const token = authHeader.slice('Bearer '.length);

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expirée ou jeton invalide, merci de vous reconnecter',
    });
  }

  const session = sessionStore.getSession(payload.sessionId);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Session introuvable (le serveur a peut-être redémarré), merci de vous reconnecter',
    });
  }

  req.odooSession = session; // { uid, email, password }
  req.sessionId = payload.sessionId;
  next();
}

module.exports = requireAuth;