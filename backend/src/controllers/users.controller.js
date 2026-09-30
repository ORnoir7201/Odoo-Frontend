const odooClient = require('../services/odooClient');

/**
 * GET /api/settings/users?includeArchived=true
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
 * Découvre dynamiquement les champs "Accès des applications" (Vente, Achats,
 * Inventaire...) présents sur ton Odoo. Chacun de ces champs s'appelle
 * "sel_groups_X_Y" en interne, avec un libellé (le nom de l'application) et
 * une liste de niveaux possibles (ex: "Utilisateur", "Gestionnaire"...).
 * On ne les devine jamais — ils dépendent des modules installés.
 */
async function getAppAccessFieldsMeta(session) {
  const allFields = await odooClient.execute(
    'res.users',
    'fields_get',
    [],
    { attributes: ['string', 'selection'] },
    session
  );

  return Object.entries(allFields)
    .filter(([key]) => key.startsWith('sel_groups_'))
    .map(([key, meta]) => ({
      field: key,
      label: meta.string,
      options: (meta.selection || []).map(([value, label]) => ({ value, label })),
    }));
}

/**
 * GET /api/settings/users/:id
 * Détail complet : photo, sociétés autorisées, société courante, et la
 * grille "Accès des applications" (découverte dynamiquement).
 */
async function getUserDetail(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const appAccessMeta = await getAppAccessFieldsMeta(session);
    const appFieldNames = appAccessMeta.map((f) => f.field);

    const users = await odooClient.execute(
      'res.users',
      'read',
      [[Number(id)]],
      {
        fields: [
          'name', 'login', 'email', 'phone', 'mobile', 'lang',
          'company_id', 'company_ids', 'active', 'image',
          ...appFieldNames,
        ],
      },
      session
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const user = users[0];

    const appAccess = appAccessMeta.map((meta) => ({
      ...meta,
      value: user[meta.field] || false,
    }));

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        login: user.login,
        email: user.email,
        phone: user.phone,
        mobile: user.mobile,
        lang: user.lang,
        active: user.active,
        image: user.image,
        company_id: user.company_id,
        company_ids: user.company_ids,
        appAccess,
      },
    });
  } catch (error) {
    console.error('Erreur getUserDetail:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer l'utilisateur", error: error.message });
  }
}

/**
 * GET /api/settings/users/app-access-fields
 * Renvoie juste la LISTE des applications disponibles (sans valeurs), pour
 * construire le formulaire de création (où il n'y a pas encore d'utilisateur
 * existant dont lire les valeurs).
 */
async function getAppAccessFields(req, res) {
  try {
    const meta = await getAppAccessFieldsMeta(req.odooSession);
    res.json({ success: true, data: meta });
  } catch (error) {
    console.error('Erreur getAppAccessFields:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer la liste des applications", error: error.message });
  }
}

/**
 * POST /api/settings/users
 * Body : { name, login, password, lang, companyId, companyIds, appAccess }
 * appAccess : { "sel_groups_14_15_16": "15", ... } (valeurs telles que
 * renvoyées par les <select> du formulaire)
 */
async function createUser(req, res) {
  try {
    const { name, login, password, lang, companyId, companyIds, appAccess , photoBase64 } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    if (!login) return res.status(400).json({ success: false, message: "L'identifiant (email) est obligatoire" });
    if (!password) return res.status(400).json({ success: false, message: 'Le mot de passe est obligatoire' });

    const session = req.odooSession;

    const userData = {
      name,
      login,
      password,
      lang: lang || false,
      company_id: companyId ? Number(companyId) : session.companyId,
      image: photoBase64 || false,
    };

    if (Array.isArray(companyIds) && companyIds.length > 0) {
      userData.company_ids = [[6, 0, companyIds.map(Number)]];
    }

    if (appAccess && typeof appAccess === 'object') {
      Object.assign(userData, appAccess);
    }

    const newId = await odooClient.execute('res.users', 'create', [userData], {}, session);

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
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, login, password, lang, companyId, companyIds, appAccess, photoBase64 } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    if (!login) return res.status(400).json({ success: false, message: "L'identifiant (email) est obligatoire" });

    const updateData = {
      name,
      login,
      lang: lang || false,
    };

    if (companyId) updateData.company_id = Number(companyId);
    if (password) updateData.password = password;
    if (Array.isArray(companyIds)) {
      updateData.company_ids = [[6, 0, companyIds.map(Number)]];
    }
    if (appAccess && typeof appAccess === 'object') {
      Object.assign(updateData, appAccess);
    }
    if (photoBase64) {
      updateData.image = photoBase64;
    } 

    await odooClient.execute('res.users', 'write', [[Number(id)], updateData], {}, req.odooSession);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateUser:', error.message);
    res.status(500).json({ success: false, message: "Impossible de modifier l'utilisateur", error: error.message });
  }
}

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
  getAppAccessFields,
  getUserDetail,
  createUser,
  updateUser,
  archiveUser,
  unarchiveUser,
};