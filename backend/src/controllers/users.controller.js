const odooClient = require('../services/odooClient');

/**
 * GET /api/settings/users?includeArchived=true
 * Liste les utilisateurs internes (comme le filtre "Utilisateurs internes"
 * sur Odoo). Par défaut, seuls les comptes actifs sont montrés.
 */
async function getUsers(req, res) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const session = req.odooSession;

    const domain = [['share', '=', false]];
    const kwargs = {
      fields: ['id', 'name', 'login', 'lang', 'login_date', 'active'],
      order: 'name asc',
    };
    if (includeArchived) {
      kwargs.context = { active_test: false };
    }

    const users = await odooClient.execute('res.users', 'search_read', [domain], kwargs, session);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Erreur getUsers:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les utilisateurs', error: error.message });
  }
}

/**
 * GET /api/settings/languages
 * Liste des langues installées sur Odoo, pour le menu déroulant "Langue".
 */
async function getLanguages(req, res) {
  try {
    const languages = await odooClient.execute(
      'res.lang',
      'search_read',
      [[['active', '=', true]]],
      { fields: ['code', 'name'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: languages });
  } catch (error) {
    console.error('Erreur getLanguages:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les langues', error: error.message });
  }
}

/**
 * GET /api/settings/users/:id
 */
async function getUserDetail(req, res) {
  try {
    const { id } = req.params;
    const users = await odooClient.execute(
      'res.users',
      'read',
      [[Number(id)]],
      { fields: ['name', 'login', 'email', 'phone', 'mobile', 'lang', 'company_id', 'active', 'image'] },
      req.odooSession
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Erreur getUserDetail:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer l'utilisateur", error: error.message });
  }
}

/**
 * POST /api/settings/users
 * Body : { name, login, password, lang, companyId }
 * Le mot de passe est OBLIGATOIRE à la création.
 */
async function createUser(req, res) {
  try {
    const { name, login, password, lang, companyId } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    if (!login) return res.status(400).json({ success: false, message: "L'identifiant (email) est obligatoire" });
    if (!password) return res.status(400).json({ success: false, message: 'Le mot de passe est obligatoire' });

    const session = req.odooSession;

    const newId = await odooClient.execute(
      'res.users',
      'create',
      [
        {
          name,
          login,
          password,
          lang: lang || false,
          company_id: companyId ? Number(companyId) : session.companyId,
        },
      ],
      {},
      session
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createUser:', error.message);
    res.status(500).json({
      success: false,
      message: "Impossible de créer l'utilisateur dans Odoo (vérifie que ton compte a les droits d'administration)",
      error: error.message,
    });
  }
}

/**
 * PUT /api/settings/users/:id
 * Body : { name, login, password (optionnel), lang, companyId }
 * Le mot de passe n'est modifié QUE si une nouvelle valeur est fournie.
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, login, password, lang, companyId } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    if (!login) return res.status(400).json({ success: false, message: "L'identifiant (email) est obligatoire" });

    const updateData = {
      name,
      login,
      lang: lang || false,
    };
    if (companyId) updateData.company_id = Number(companyId);
    if (password) updateData.password = password;

    await odooClient.execute('res.users', 'write', [[Number(id)], updateData], {}, req.odooSession);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateUser:', error.message);
    res.status(500).json({ success: false, message: "Impossible de modifier l'utilisateur", error: error.message });
  }
}

/**
 * POST /api/settings/users/:id/archive
 * On archive plutôt que supprimer (comme le fait Odoo par défaut) — un
 * utilisateur supprimé peut casser des enregistrements liés ailleurs.
 */
async function archiveUser(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('res.users', 'write', [[Number(id)], { active: false }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur archiveUser:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'archiver l'utilisateur", error: error.message });
  }
}

/**
 * POST /api/settings/users/:id/unarchive
 */
async function unarchiveUser(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('res.users', 'write', [[Number(id)], { active: true }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur unarchiveUser:', error.message);
    res.status(500).json({ success: false, message: "Impossible de réactiver l'utilisateur", error: error.message });
  }
}

module.exports = {
  getUsers,
  getLanguages,
  getUserDetail,
  createUser,
  updateUser,
  archiveUser,
  unarchiveUser,
};