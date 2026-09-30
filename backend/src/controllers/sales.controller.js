const odooClient = require('../services/odooClient');
const odooConfig = require('../config/odoo.config');

const STATE_LABELS = {
  draft: 'Devis',
  sent: 'Devis envoyé',
  sale: 'Bon de commande',
  done: 'Verrouillée',
  cancel: 'Annulé',
};

/**
 * Récupère un pricelist_id valide (champ obligatoire sur sale.order,
 * mais sans valeur par défaut automatique en création via API — contrairement
 * à l'interface Odoo qui le déduit du client choisi). On prend simplement
 * la première liste de prix disponible.
 */
async function getDefaultPricelistId(session) {
  const pricelists = await odooClient.execute(
    'product.pricelist',
    'search_read',
    [[]],
    { fields: ['id'], limit: 1 },
    session
  );
  return pricelists.length > 0 ? pricelists[0].id : false;
}

/**
 * GET /api/sales/salespersons
 * Liste les utilisateurs Odoo utilisables comme vendeur.
 */
async function getSalespersons(req, res) {
  try {
    const users = await odooClient.execute(
      'res.users',
      'search_read',
      [[['active', '=', true]]],
      { fields: ['id', 'name'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Erreur getSalespersons:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les vendeurs', error: error.message });
  }
}

/**
 * GET /api/sales/taxes
 * Taxes utilisables sur les ventes (type_tax_use = 'sale').
 */
async function getTaxes(req, res) {
  try {
    const taxes = await odooClient.execute(
      'account.tax',
      'search_read',
      [[['type_tax_use', '=', 'sale']]],
      { fields: ['id', 'name'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: taxes });
  } catch (error) {
    console.error('Erreur getTaxes (sales):', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les taxes', error: error.message });
  }
}

/**
 * GET /api/sales/payment-terms
 */
async function getPaymentTerms(req, res) {
  try {
    const terms = await odooClient.execute(
      'account.payment.term',
      'search_read',
      [[]],
      { fields: ['id', 'name'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: terms });
  } catch (error) {
    console.error('Erreur getPaymentTerms:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les conditions de paiement', error: error.message });
  }
}

/**
 * GET /api/sales
 * Liste les devis / commandes de vente.
 */
async function getSales(req, res) {
  try {
    const onlyMine = req.query.onlyMine !== 'false'; // true par défaut
    const session = req.odooSession;

    const domain = onlyMine ? [['user_id', '=', session.uid]] : [];

    const orders = await odooClient.execute(
      'sale.order',
      'search_read',
      [domain],
      {
        fields: ['id', 'name', 'partner_id', 'user_id', 'company_id', 'date_order', 'amount_total', 'state'],
        order: 'create_date desc',
      },
      session
    );

    const withLabels = orders.map((o) => ({ ...o, state_label: STATE_LABELS[o.state] || o.state }));
    res.json({ success: true, data: withLabels });
  } catch (error) {
    console.error('Erreur getSales:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les devis depuis Odoo', error: error.message });
  }
}

/**
 * GET /api/sales/:id
 */
async function getSaleDetail(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const orders = await odooClient.execute(
      'sale.order',
      'read',
      [[Number(id)]],
      {
        fields: [
          'name', 'partner_id', 'user_id', 'company_id', 'date_order', 'validity_date',
          'payment_term_id', 'amount_untaxed', 'amount_tax', 'amount_total',
          'state', 'order_line', 'access_url', 'description_sale',
        ],
      },
      session
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Devis introuvable' });
    }

    const order = { ...orders[0], state_label: STATE_LABELS[orders[0].state] || orders[0].state };

    // Récupère l'adresse du client pour l'afficher sur le document
    let partnerAddress = null;
    if (order.partner_id) {
      const partners = await odooClient.execute(
        'res.partner',
        'read',
        [[order.partner_id[0]]],
        { fields: ['street', 'street2', 'city', 'zip', 'country_id'] },
        session
      );
      partnerAddress = partners[0];
    }
    order.partner_address = partnerAddress;

    const lines = await odooClient.execute(
      'sale.order.line',
      'read',
      [order.order_line],
      { fields: ['product_id', 'name', 'product_uom_qty', 'price_unit', 'discount', 'tax_id', 'price_subtotal'] },
      session
    );

    const allTaxIds = [...new Set(lines.flatMap((l) => l.tax_id))];
    let taxNamesById = {};
    if (allTaxIds.length > 0) {
      const taxes = await odooClient.execute('account.tax', 'read', [allTaxIds], { fields: ['name'] }, session);
      taxNamesById = Object.fromEntries(taxes.map((t) => [t.id, t.name]));
    }

    const linesWithTaxNames = lines.map((l) => ({
      ...l,
      tax_names: l.tax_id.map((taxId) => taxNamesById[taxId] || '?'),
    }));

    res.json({ success: true, data: { order, lines: linesWithTaxNames } });
  } catch (error) {
    console.error('Erreur getSaleDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le détail du devis', error: error.message });
  }
}

/**
 * Construit les commandes de lignes (0,0,{...}) à partir du body reçu.
 */
async function buildOrderLineCommands(lines, session) {
  const productIds = lines.map((l) => Number(l.productId));
  const products = await odooClient.execute('product.product', 'read', [productIds], { fields: ['name', 'uom_id'] }, session);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return lines.map((line) => {
    const product = productsById[Number(line.productId)];
    return [
      0,
      0,
      {
        product_id: Number(line.productId),
        product_uom_qty: Number(line.quantity),
        price_unit: Number(line.priceUnit),
        discount: Number(line.discount) || 0,
        product_uom: product.uom_id[0],
        name: product.name,
        tax_id: line.taxId ? [[6, 0, [Number(line.taxId)]]] : [[6, 0, []]],
      },
    ];
  });
}

/**
 * POST /api/sales
 * Body : { partnerId, dateOrder, validityDate, paymentTermId, lines: [...] }
 */

async function createSale(req, res) {
  try {
    const { partnerId, dateOrder, validityDate, paymentTermId, userId, companyId, lines } = req.body;

    if (!partnerId) return res.status(400).json({ success: false, message: 'Le client est obligatoire' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Ajoute au moins un produit au devis' });
    }

    const session = req.odooSession;
    const orderLineCommands = await buildOrderLineCommands(lines, session);
    const pricelistId = await getDefaultPricelistId(session);

    const orderData = {
      partner_id: Number(partnerId),
      partner_invoice_id: Number(partnerId),
      partner_shipping_id: Number(partnerId),
      pricelist_id: pricelistId,
      date_order: dateOrder,
      validity_date: validityDate || false,
      payment_term_id: paymentTermId ? Number(paymentTermId) : false,
      user_id: userId ? Number(userId) : session.uid, // vendeur choisi, sinon la personne connectée
      order_line: orderLineCommands,
    };

    // company_id est optionnel sur sale.order : si rien n'est choisi,
    // on laisse Odoo appliquer sa société par défaut plutôt que de forcer une valeur.
    if (companyId) {
      orderData.company_id = Number(companyId);
    }

    const newId = await odooClient.execute('sale.order', 'create', [orderData], {}, session);

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createSale:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer le devis dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * PUT /api/sales/:id
 */
async function updateSale(req, res) {
  try {
    const { id } = req.params;
    const { partnerId, dateOrder, validityDate, paymentTermId, userId, companyId, lines } = req.body;

    if (!partnerId) return res.status(400).json({ success: false, message: 'Le client est obligatoire' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Ajoute au moins un produit au devis' });
    }

    const session = req.odooSession;
    const newLineCommands = await buildOrderLineCommands(lines, session);

    const updateData = {
      partner_id: Number(partnerId),
      partner_invoice_id: Number(partnerId),
      partner_shipping_id: Number(partnerId),
      date_order: dateOrder,
      validity_date: validityDate || false,
      payment_term_id: paymentTermId ? Number(paymentTermId) : false,
      order_line: [[5, 0, 0], ...newLineCommands],
    };

    if (userId) updateData.user_id = Number(userId);
    if (companyId) updateData.company_id = Number(companyId);

    await odooClient.execute('sale.order', 'write', [[Number(id)], updateData], {}, session);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateSale:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier le devis', error: error.message });
  }
}

/**
 * DELETE /api/sales/:id
 */
async function deleteSale(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('sale.order', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteSale:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de supprimer ce devis (il est peut-être déjà confirmé)', error: error.message });
  }
}

/**
 * POST /api/sales/:id/send
 * Simplifié comme pour les achats : change juste le statut, n'envoie pas
 * de vrai email.
 */
async function sendSale(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('sale.order', 'write', [[Number(id)], { state: 'sent' }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sendSale:', error.message);
    res.status(500).json({ success: false, message: "Impossible de marquer le devis comme envoyé", error: error.message });
  }
}

/**
 * POST /api/sales/:id/confirm
 */
async function confirmSale(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('sale.order', 'action_confirm', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur confirmSale:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de confirmer le devis', error: error.message });
  }
}

/**
 * POST /api/sales/:id/cancel
 */
async function cancelSale(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('sale.order', 'action_cancel', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur cancelSale:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'annuler le devis", error: error.message });
  }
}

/**
 * POST /api/sales/:id/duplicate
 */
async function duplicateSale(req, res) {
  try {
    const { id } = req.params;
    const newId = await odooClient.execute('sale.order', 'copy', [[Number(id)], {}], {}, req.odooSession);
    res.json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur duplicateSale:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de dupliquer ce devis', error: error.message });
  }
}

/**
 * GET /api/sales/:id/share
 */
async function getShareLink(req, res) {
  try {
    const { id } = req.params;
    const orders = await odooClient.execute('sale.order', 'read', [[Number(id)]], { fields: ['access_url'] }, req.odooSession);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Devis introuvable' });

    const shareUrl = `${odooConfig.url}:${odooConfig.port}${orders[0].access_url}`;
    res.json({ success: true, url: shareUrl });
  } catch (error) {
    console.error('Erreur getShareLink (sales):', error.message);
    res.status(500).json({ success: false, message: 'Impossible de générer le lien de partage', error: error.message });
  }
}

/**
 * POST /api/sales/:id/invoice
 * Fonctionnalité expérimentale : tente de générer la facture directement.
 * Le nom de la méthode Odoo pour ça varie selon les versions — si ça échoue,
 * le message d'erreur nous dira quoi ajuster.
 */
async function invoiceSale(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('sale.order', 'action_invoice_create', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur invoiceSale:', error.message);
    res.status(500).json({
      success: false,
      message: "Impossible de générer la facture (fonctionnalité expérimentale, peut nécessiter un ajustement selon ta version d'Odoo)",
      error: error.message,
    });
  }
}

module.exports = {
  getSales,
  getSaleDetail,
  createSale,
  updateSale,
  deleteSale,
  sendSale,
  confirmSale,
  cancelSale,
  duplicateSale,
  getShareLink,
  getTaxes,
  getPaymentTerms,
  getSalespersons,
  invoiceSale,
};