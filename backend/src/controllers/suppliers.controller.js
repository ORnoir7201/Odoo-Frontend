const odooClient = require('../services/odooClient');

/**
 * Un "fournisseur" n'est pas un modèle Odoo à part — c'est un contact
 * (res.partner) comme les autres, simplement marqué comme fournisseur via
 * le champ interne `supplier` (= true). C'est exactement ce que fait la
 * case à cocher "Fournisseur" dans Odoo.
 */

async function findCountryId(countryName, session) {
  if (!countryName || !countryName.trim()) {
    return false;
  }

  const results = await odooClient.execute(
    'res.country',
    'search',
    [[['name', 'ilike', countryName.trim()]]],
    { limit: 1 },
    session
  );

  return results.length > 0 ? results[0] : false;
}

/**
 * GET /api/suppliers
 * Liste uniquement les contacts marqués comme fournisseurs.
 */
async function getSuppliers(req, res) {
  try {
    const suppliers = await odooClient.execute(
      'res.partner',
      'search_read',
      [[['supplier', '=', true]]],
      {
        fields: ['id', 'name', 'email', 'phone', 'website', 'is_company', 'street', 'city', 'zip', 'country_id'],
        order: 'create_date desc',
      },
      req.odooSession
    );

    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Erreur getSuppliers:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les fournisseurs depuis Odoo',
      error: error.message,
    });
  }
}

/**
 * GET /api/suppliers/:id
 * Détail complet d'un fournisseur (avec sa photo).
 */
async function getSupplierDetail(req, res) {
  try {
    const { id } = req.params;
    const suppliers = await odooClient.execute(
      'res.partner',
      'read',
      [[Number(id)]],
      {
        fields: [
          'name', 'email', 'phone', 'mobile', 'website', 'vat', 'is_company',
          'street', 'street2', 'city', 'zip', 'country_id', 'image',
        ],
      },
      req.odooSession
    );

    if (suppliers.length === 0) {
      return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
    }

    res.json({ success: true, data: suppliers[0] });
  } catch (error) {
    console.error('Erreur getSupplierDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le fournisseur', error: error.message });
  }
}

/**
 * POST /api/suppliers
 * Body : { name, email, phone, mobile, website, vat, isCompany,
 *          street, street2, city, zip, country, photoBase64 }
 */
async function createSupplier(req, res) {
  try {
    const {
      name, email, phone, mobile, website, vat, isCompany,
      street, street2, city, zip, country, photoBase64,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est obligatoire' });
    }

    const countryId = await findCountryId(country, req.odooSession);

    const newId = await odooClient.execute(
      'res.partner',
      'create',
      [
        {
          name,
          email: email || false,
          phone: phone || false,
          mobile: mobile || false,
          website: website || false,
          vat: vat || false,
          is_company: Boolean(isCompany),
          street: street || false,
          street2: street2 || false,
          city: city || false,
          zip: zip || false,
          country_id: countryId,
          image: photoBase64 || false,
          supplier: true, // c'est cette ligne qui marque le contact comme "Fournisseur"
        },
      ],
      {},
      req.odooSession
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createSupplier:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer le fournisseur dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * PUT /api/suppliers/:id
 */
async function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const {
      name, email, phone, mobile, website, vat, isCompany,
      street, street2, city, zip, country, photoBase64,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est obligatoire' });
    }

    const countryId = await findCountryId(country, req.odooSession);

    const updateData = {
      name,
      email: email || false,
      phone: phone || false,
      mobile: mobile || false,
      website: website || false,
      vat: vat || false,
      is_company: Boolean(isCompany),
      street: street || false,
      street2: street2 || false,
      city: city || false,
      zip: zip || false,
      country_id: countryId,
      // Pas de "supplier: true" ici — on ne le touche pas, il reste tel quel
      // (donc toujours fournisseur, sans qu'on ait besoin de le repréciser)
    };

    if (photoBase64) {
      updateData.image = photoBase64;
    }

    await odooClient.execute('res.partner', 'write', [[Number(id)], updateData], {}, req.odooSession);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateSupplier:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de modifier le fournisseur dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/suppliers/:id
 */
async function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('res.partner', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteSupplier:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de supprimer le fournisseur dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

module.exports = {
  getSuppliers,
  getSupplierDetail,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};