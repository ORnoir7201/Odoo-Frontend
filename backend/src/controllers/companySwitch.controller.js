const odooClient = require('../services/odooClient');
const sessionStore = require('../services/sessionStore');

/**
 * GET /api/settings/my-companies
 * Liste les sociétés accessibles par la personne connectée, avec la société
 * actuellement active (celle sélectionnée dans le petit menu "SITCOM ▾").
 */
async function getMyCompanies(req, res) {
  try {
    const session = req.odooSession;

    if (!session.companyIds || session.companyIds.length === 0) {
      return res.json({ success: true, data: { companies: [], activeCompanyId: session.companyId } });
    }

    const companies = await odooClient.execute(
      'res.company',
      'read',
      [session.companyIds],
      { fields: ['id', 'name'] },
      session
    );

    res.json({ success: true, data: { companies, activeCompanyId: session.companyId } });
  } catch (error) {
    console.error('Erreur getMyCompanies:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les sociétés', error: error.message });
  }
}

/**
 * POST /api/settings/switch-company
 * Body : { companyId }
 * Change la société active de LA SESSION EN COURS (donc pour cette personne
 * uniquement, sans affecter les autres utilisateurs connectés).
 */
async function switchCompany(req, res) {
  try {
    const { companyId } = req.body;
    const session = req.odooSession;

    if (!companyId || !session.companyIds.includes(Number(companyId))) {
      return res.status(400).json({ success: false, message: "Tu n'as pas accès à cette société" });
    }

    sessionStore.updateSession(req.sessionId, { companyId: Number(companyId) });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur switchCompany:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de changer de société', error: error.message });
  }
}

module.exports = {
  getMyCompanies,
  switchCompany,
};