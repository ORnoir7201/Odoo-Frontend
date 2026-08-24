const odooClient = require('../services/odooClient');
const odooConfig = require('../config/odoo.config');

/**
 * Traduit le champ technique "state" d'Odoo en libellé français lisible.
 * (Le champ state est un texte technique en anglais côté Odoo : draft,
 * sent, purchase, done, cancel)
 */
const STATE_LABELS = {
  draft: 'Demande de prix',
  sent: 'Demande envoyée',
  purchase: 'Commande confirmée',
  done: 'Verrouillée',
  cancel: 'Annulée',
};

/**
 * GET /api/purchases/buyers
 * Liste les utilisateurs Odoo utilisables comme responsable achats.
 */
async function getBuyers(req, res) {
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
    console.error('Erreur getBuyers:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les responsables achats', error: error.message });
  }
}

/**
 * GET /api/purchases
 * Liste les commandes d'achat (purchase.order).
 */
async function getPurchases(req, res) {
  try {
    const orders = await odooClient.execute(
      'purchase.order',
      'search_read',
      [[]],
      {
        fields: ['id', 'name', 'partner_id', 'company_id','user_id', 'date_order', 'date_planned', 'amount_untaxed', 'amount_total', 'state'],
        order: 'create_date desc',
        
      },
      req.odooSession
    );

    const withLabels = orders.map((o) => ({ ...o, state_label: STATE_LABELS[o.state] || o.state }));

    res.json({ success: true, data: withLabels });
  } catch (error) {
    console.error('Erreur getPurchases:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les commandes depuis Odoo',
      error: error.message,
    });
  }
}

/**
 * POST /api/purchases
 * Crée une commande d'achat avec ses lignes de produits en une seule fois.
 *
 * Body attendu :
 * {
 *   partnerId: number,       // le fournisseur (res.partner)
 *   companyId: number,       // la société (res.company)
 *   dateOrder: string,       // "2026-07-22 10:00:00"
 *   lines: [
 *     { productId: number, quantity: number, priceUnit: number }
 *   ]
 * }
 */
async function createPurchase(req, res) {
  try {
    const { partnerId, companyId, dateOrder, datePlanned, userId,  lines } = req.body;

    if (!partnerId) {
      return res.status(400).json({ success: false, message: 'Le fournisseur est obligatoire' });
    }
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'La société est obligatoire' });
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Ajoute au moins un produit à la commande' });
    }

    const session = req.odooSession;

    // Chaque ligne de commande a besoin de l'unité de mesure (product_uom)
    // et du nom du produit — on les récupère en un seul appel groupé.
    const productIds = lines.map((l) => Number(l.productId));
    const products = await odooClient.execute(
      'product.product',
      'read',
      [productIds],
      { fields: ['name', 'uom_id'] },
      session
    );
    const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

    const orderLineCommands = lines.map((line) => {
      const product = productsById[Number(line.productId)];
      return [
        0,
        0, // (0, 0, {...}) = "crée une nouvelle ligne liée à cette commande", syntaxe standard Odoo
        {
          product_id: Number(line.productId),
          product_qty: Number(line.quantity),
          price_unit: Number(line.priceUnit),
          product_uom: product.uom_id[0], // [0] = l'id, [1] serait le nom
          name: product.name,
          date_planned: datePlanned || dateOrder,
          taxes_id: line.taxId ? [[6, 0, [Number(line.taxId)]]] : [[6, 0, []]],
        },
      ];
    });

    const newId = await odooClient.execute(
      'purchase.order',
      'create',
      [
        {
          partner_id: Number(partnerId),
          company_id: Number(companyId),
          date_order: dateOrder,
          date_planned: datePlanned || dateOrder,
          user_id: Number(userId),
          order_line: orderLineCommands,
        },
      ],
      {},
      session
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createPurchase:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer la commande dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/purchases/:id
 * Note : Odoo refuse de supprimer une commande déjà confirmée — seules
 * les "Demande de prix" (état draft) peuvent être supprimées directement.
 */
async function deletePurchase(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('purchase.order', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deletePurchase:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de supprimer cette commande (elle est peut-être déjà confirmée)',
      error: error.message,
    });
  }
}

/**
 * GET /api/purchases/:id
 * Détail complet d'une commande : infos générales + toutes ses lignes,
 * avec le nom des taxes appliquées (comme sur la fiche Odoo).
 */
async function getPurchaseDetail(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const orders = await odooClient.execute(
      'purchase.order',
      'read',
      [[Number(id)]],
      {
        fields: [
          'name', 'partner_id', 'partner_ref', 'date_order', 'date_planned','user_id',
          'company_id', 'amount_untaxed', 'amount_tax', 'amount_total', 'state',
          'order_line', 'access_url',
        ],
      },
      session
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    const order = { ...orders[0], state_label: STATE_LABELS[orders[0].state] || orders[0].state };
    
    // Récupère l'adresse du fournisseur pour l'afficher sur le document
    let partnerAddress = null;
    if (order.partner_id) {
      const partners = await odooClient.execute(
        'res.partner',
        'read',
        [[order.partner_id[0]]],
        { fields: ['street', 'city', 'zip', 'country_id'] },
        session
      );
      partnerAddress = partners[0];
    }
    
order.partner_address = partnerAddress;
    const lines = await odooClient.execute(
      'purchase.order.line',
      'read',
      [order.order_line],
      {
        fields: ['product_id', 'name', 'date_planned', 'company_id', 'product_qty', 'price_unit', 'price_subtotal', 'taxes_id'],
      },
      session
    );

    // Les lignes ne renvoient que des IDs de taxes — on récupère leurs noms en un seul appel groupé.
    const allTaxIds = [...new Set(lines.flatMap((l) => l.taxes_id))];
    let taxNamesById = {};
    if (allTaxIds.length > 0) {
      const taxes = await odooClient.execute('account.tax', 'read', [allTaxIds], { fields: ['name'] }, session);
      taxNamesById = Object.fromEntries(taxes.map((t) => [t.id, t.name]));
    }

    const linesWithTaxNames = lines.map((l) => ({
      ...l,
      tax_names: l.taxes_id.map((taxId) => taxNamesById[taxId] || '?'),
    }));

    res.json({ success: true, data: { order, lines: linesWithTaxNames } });
  } catch (error) {
    console.error('Erreur getPurchaseDetail:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer le détail de la commande',
      error: error.message,
    });
  }
}

/**
 * POST /api/purchases/:id/send
 * Version simplifiée de "Envoyer par email" : fait passer le statut à
 * "Demande envoyée", sans réellement envoyer d'email (ça demanderait un
 * serveur SMTP configuré dans Odoo, hors périmètre ici).
 */
async function sendPurchase(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('purchase.order', 'write', [[Number(id)], { state: 'sent' }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sendPurchase:', error.message);
    res.status(500).json({ success: false, message: "Impossible de marquer la commande comme envoyée", error: error.message });
  }
}

/**
 * POST /api/purchases/:id/confirm
 * Utilise la vraie méthode Odoo button_confirm — donc le vrai workflow
 * s'applique (création des réceptions de stock, etc.), pas juste un
 * changement de statut brut.
 */
async function confirmPurchase(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('purchase.order', 'button_confirm', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur confirmPurchase:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de confirmer la commande', error: error.message });
  }
}

/**
 * POST /api/purchases/:id/cancel
 */
async function cancelPurchase(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('purchase.order', 'button_cancel', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur cancelPurchase:', error.message);
    res.status(500).json({ success: false, message: 'Impossible d\'annuler la commande', error: error.message });
  }
}

/**
 * POST /api/purchases/:id/duplicate
 * Utilise la méthode standard Odoo 'copy', qui duplique l'enregistrement
 * (et ses lignes) exactement comme le bouton "Dupliquer" d'Odoo.
 */
async function duplicatePurchase(req, res) {
  try {
    const { id } = req.params;
    const newId = await odooClient.execute('purchase.order', 'copy', [[Number(id)], {}], {}, req.odooSession);
    res.json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur duplicatePurchase:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de dupliquer la commande', error: error.message });
  }
}

/**
 * GET /api/purchases/:id/share
 * Renvoie le lien de partage portail (le même que "Partager" sur Odoo) :
 * Odoo calcule déjà ce lien dans le champ access_url, on le combine juste
 * avec l'adresse de ton serveur.
 */
async function getShareLink(req, res) {
  try {
    const { id } = req.params;
    const orders = await odooClient.execute(
      'purchase.order',
      'read',
      [[Number(id)]],
      { fields: ['access_url'] },
      req.odooSession
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    const shareUrl = `${odooConfig.url}:${odooConfig.port}${orders[0].access_url}`;
    res.json({ success: true, url: shareUrl });
  } catch (error) {
    console.error('Erreur getShareLink:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de générer le lien de partage', error: error.message });
  }
}

/**
 * GET /api/purchases/taxes
 * Liste les taxes utilisables sur les achats (account.tax), pour peupler
 * le menu déroulant "Taxes" du formulaire de commande.
 */
async function getTaxes(req, res) {
  try {
    const taxes = await odooClient.execute(
      'account.tax',
      'search_read',
      [[['type_tax_use', '=', 'purchase']]],
      { fields: ['id', 'name', 'amount'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: taxes });
  } catch (error) {
    console.error('Erreur getTaxes:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les taxes', error: error.message });
  }
}

/**
 * PUT /api/purchases/:id
 * Modifie une commande existante : infos générales + remplace entièrement
 * ses lignes de produits (plus simple et plus sûr que d'essayer de faire
 * correspondre chaque ancienne ligne à une nouvelle).
 */
async function updatePurchase(req, res) {
  try {
    const { id } = req.params;
    const { partnerId, companyId, dateOrder, datePlanned, userId, lines } = req.body;

    if (!partnerId) return res.status(400).json({ success: false, message: 'Le fournisseur est obligatoire' });
    if (!companyId) return res.status(400).json({ success: false, message: 'La société est obligatoire' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Ajoute au moins un produit à la commande' });
    }

    const session = req.odooSession;

    const productIds = lines.map((l) => Number(l.productId));
    const products = await odooClient.execute('product.product', 'read', [productIds], { fields: ['name', 'uom_id'] }, session);
    const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

    const newLineCommands = lines.map((line) => {
      const product = productsById[Number(line.productId)];
      return [
        0,
        0,
        {
          product_id: Number(line.productId),
          product_qty: Number(line.quantity),
          price_unit: Number(line.priceUnit),
          product_uom: product.uom_id[0],
          name: product.name,
          date_planned: datePlanned || dateOrder,
          taxes_id: line.taxId ? [[6, 0, [Number(line.taxId)]]] : [[6, 0, []]],
        },
      ];
    });

    const updateData = {
  partner_id: Number(partnerId),
  company_id: Number(companyId),
  date_order: dateOrder,
  date_planned: datePlanned || dateOrder,
  order_line: [[5, 0, 0], ...newLineCommands],
};
if (userId) {
  updateData.user_id = Number(userId);
}

await odooClient.execute('purchase.order', 'write', [[Number(id)], updateData], {}, session);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updatePurchase:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier la commande', error: error.message });
  }
}

module.exports = {
  getPurchases,
  getPurchaseDetail,
  createPurchase,
  updatePurchase,
  deletePurchase,
  sendPurchase,
  confirmPurchase,
  cancelPurchase,
  duplicatePurchase,
  getShareLink,
  getTaxes,
  getBuyers,
};