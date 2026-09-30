const odooClient = require('../services/odooClient');

/**
 * GET /api/settings/layouts
 * Découvre dynamiquement les modèles de document disponibles (les "vues"
 * ir.ui.view utilisées pour l'en-tête/pied de page des factures, devis...).
 * On ne devine jamais leurs noms techniques — on les cherche par motif,
 * comme on l'a fait pour les catégories et les pays.
 */
async function getLayouts(req, res) {
  try {
    const layouts = await odooClient.execute(
      'ir.ui.view',
      'search_read',
      [[['key', 'like', 'external_layout']]],
      { fields: ['id', 'key', 'name'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: layouts });
  } catch (error) {
    console.error('Erreur getLayouts:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les modèles de document', error: error.message });
  }
}

/**
 * Trouve l'ID de la société actuelle de la personne connectée
 * (celle affichée en haut à droite dans Odoo), sans qu'elle ait besoin
 * de la choisir dans un menu.
 */
async function getMyCompanyId(session) {
  const users = await odooClient.execute(
    'res.users',
    'read',
    [[session.uid]],
    { fields: ['company_id'] },
    session
  );
  return users[0].company_id[0];
}

/**
 * GET /api/settings/company
 * Paramètres de présentation de MA société (déduite automatiquement).
 */
async function getMyCompanySettings(req, res) {
  try {
    const session = req.odooSession;
    const companyId = await getMyCompanyId(session);

    const companies = await odooClient.execute(
      'res.company',
      'read',
      [[companyId]],
      {
        fields: [
          'name', 'logo', 'email', 'phone', 'website', 'vat',
          'street', 'street2', 'city', 'zip', 'country_id',
          'report_header', 'report_footer', 'external_report_layout_id',
        ],
      },
      session
    );

    res.json({ success: true, data: companies[0] });
  } catch (error) {
    console.error('Erreur getMyCompanySettings:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les paramètres de la société', error: error.message });
  }
}

/**
 * PUT /api/settings/company
 * Met à jour MA société (déduite automatiquement).
 * Body : { name, email, phone, website, vat, street, street2, city, zip,
 *          reportHeader, reportFooter, layoutId, logoBase64 }
 * logoBase64 : chaîne base64 SANS le préfixe "data:image/...;base64," —
 * c'est le format brut attendu par Odoo pour les champs binaires.
 */
async function updateMyCompanySettings(req, res) {
  try {
    const session = req.odooSession;
    const companyId = await getMyCompanyId(session);

    const {
      name, email, phone, website, vat,
      street, street2, city, zip,
      reportHeader, reportFooter, layoutId, logoBase64,
    } = req.body;

    const updateData = {
      name,
      email: email || false,
      phone: phone || false,
      website: website || false,
      vat: vat || false,
      street: street || false,
      street2: street2 || false,
      city: city || false,
      zip: zip || false,
      report_header: reportHeader || false,
      report_footer: reportFooter || false,
    };

    if (layoutId) {
      updateData.external_report_layout_id = Number(layoutId);
    }

    if (logoBase64) {
      updateData.logo = logoBase64;
    }

    await odooClient.execute('res.company', 'write', [[companyId], updateData], {}, session);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateMyCompanySettings:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de mettre à jour les paramètres', error: error.message });
  }
}

/**
 * GET /api/settings/companies
 * Liste toutes les sociétés (pas juste "ma société").
 */
async function getCompaniesAdmin(req, res) {
  try {
    const companies = await odooClient.execute(
      'res.company',
      'search_read',
      [[]],
      { fields: ['id', 'name', 'email', 'city'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Erreur getCompaniesAdmin:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les sociétés', error: error.message });
  }
}

/**
 * GET /api/settings/companies/:id
 */
async function getCompanyAdminDetail(req, res) {
  try {
    const { id } = req.params;
    const companies = await odooClient.execute(
      'res.company',
      'read',
      [[Number(id)]],
      {
        fields: [
          'name', 'logo', 'email', 'phone', 'website', 'vat',
          'street', 'street2', 'city', 'zip', 'country_id',
          'report_header', 'report_footer', 'external_report_layout_id',
        ],
      },
      req.odooSession
    );

    if (companies.length === 0) {
      return res.status(404).json({ success: false, message: 'Société introuvable' });
    }

    res.json({ success: true, data: companies[0] });
  } catch (error) {
    console.error('Erreur getCompanyAdminDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer la société', error: error.message });
  }
}

/**
 * POST /api/settings/companies
 * Crée une nouvelle société. Attention : selon la version d'Odoo, la
 * création d'une société peut nécessiter une configuration comptable
 * complémentaire (plan de comptes) faite normalement via un assistant —
 * ici on crée la fiche de base, ce qui suffit pour la plupart des usages.
 */
async function createCompanyAdmin(req, res) {
  try {
    const { name, email, phone, website, vat, street, street2, city, zip, logoBase64 } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le nom de la société est obligatoire' });
    }

    const newId = await odooClient.execute(
      'res.company',
      'create',
      [
        {
          name,
          email: email || false,
          phone: phone || false,
          website: website || false,
          vat: vat || false,
          street: street || false,
          street2: street2 || false,
          city: city || false,
          zip: zip || false,
          logo: logoBase64 || false,
        },
      ],
      {},
      req.odooSession
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createCompanyAdmin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer la société dans Odoo (vérifie les droits, ou une configuration comptable manquante)',
      error: error.message,
    });
  }
}

/**
 * PUT /api/settings/companies/:id
 * Même logique que "Paramètres généraux", mais applicable à n'importe
 * quelle société (par son id), pas seulement la société active.
 */
async function updateCompanyAdmin(req, res) {
  try {
    const { id } = req.params;
    const {
      name, email, phone, website, vat,
      street, street2, city, zip,
      reportHeader, reportFooter, layoutId, logoBase64,
    } = req.body;

    const updateData = {
      name,
      email: email || false,
      phone: phone || false,
      website: website || false,
      vat: vat || false,
      street: street || false,
      street2: street2 || false,
      city: city || false,
      zip: zip || false,
      report_header: reportHeader || false,
      report_footer: reportFooter || false,
    };

    if (layoutId) updateData.external_report_layout_id = Number(layoutId);
    if (logoBase64) updateData.logo = logoBase64;

    await odooClient.execute('res.company', 'write', [[Number(id)], updateData], {}, req.odooSession);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateCompanyAdmin:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier la société', error: error.message });
  }
}

module.exports = {
  getLayouts,
  getMyCompanySettings,
  updateMyCompanySettings,
  getCompaniesAdmin,      // ← ajouté
  getCompanyAdminDetail,  // ← ajouté
  createCompanyAdmin,     // ← ajouté
  updateCompanyAdmin,
};