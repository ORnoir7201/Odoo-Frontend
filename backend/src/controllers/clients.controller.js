const odooClient = require('../services/odooClient');

/**
 * Cherche l'ID d'un pays à partir de son nom (recherche uniquement,
 * jamais de création — voir la discussion sur pourquoi plus haut).
 * Utilise les identifiants de LA PERSONNE CONNECTÉE (req.odooSession).
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
 * GET /api/clients
 * Liste les contacts visibles PAR LA PERSONNE CONNECTÉE (ses propres droits
 * Odoo s'appliquent : si elle a des restrictions d'accès, elles s'appliquent ici aussi).
 */
async function getClients(req, res) {
  try {
    const clients = await odooClient.execute(
      'res.partner',
      'search_read',
      [[]],
      {
        fields: ['id', 'name', 'email', 'phone', 'street', 'city', 'zip', 'country_id'],
        order: 'create_date desc',
      },
      req.odooSession
    );

    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('Erreur getClients:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les clients depuis Odoo',
      error: error.message,
    });
  }
}

/**
 * POST /api/clients
 * Crée un contact EN TANT QUE la personne connectée.
 */
async function createClient(req, res) {
  try {
    const { name, email, phone, mobile, website, vat, isCompany, street, street2, city, zip, country, photoBase64 } = req.body;

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
        },
      ],
      {},
      req.odooSession
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createClient:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer le client dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * GET /api/clients/:id
 * Détail complet d'un contact (avec sa photo).
 */
async function getClientDetail(req, res) {
  try {
    const { id } = req.params;
    const clients = await odooClient.execute(
      'res.partner',
      'read',
      [[Number(id)]],
      { fields: ['name', 'email', 'phone', 'mobile', 'website', 'vat', 'is_company', 'street', 'street2', 'city', 'zip', 'country_id', 'image'] },
      req.odooSession
    );

    if (clients.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact introuvable' });
    }

    res.json({ success: true, data: clients[0] });
  } catch (error) {
    console.error('Erreur getClientDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le contact', error: error.message });
  }
}

/**
 * PUT /api/clients/:id
 */
async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, mobile, website, vat, isCompany, street, street2, city, zip, country, photoBase64 } = req.body;

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
    };

    // On ne touche à la photo que si une nouvelle a été envoyée,
    // pour ne pas écraser l'existante à chaque sauvegarde du formulaire.
    if (photoBase64) {
      updateData.image = photoBase64;
    }

    await odooClient.execute('res.partner', 'write', [[Number(id)], updateData], {}, req.odooSession);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateClient:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de modifier le client dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}



/**
 * DELETE /api/clients/:id
 */
async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('res.partner', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteClient:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de supprimer le client dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

module.exports = {
  getClients,
  getClientDetail, // ← ajouté
  createClient,
  updateClient,
  deleteClient,
};