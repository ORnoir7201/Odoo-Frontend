const odooClient = require('../services/odooClient');

/**
 * GET /api/companies
 * Liste les sociétés visibles PAR LA PERSONNE CONNECTÉE.
 */
async function getCompanies(req, res) {
  try {
    const companies = await odooClient.execute(
      'res.company',
      'search_read',
      [[]],
      { fields: ['id', 'name'], order: 'name asc' },
      req.odooSession
    );

    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Erreur getCompanies:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les sociétés depuis Odoo',
      error: error.message,
    });
  }
}

module.exports = {
  getCompanies,
};