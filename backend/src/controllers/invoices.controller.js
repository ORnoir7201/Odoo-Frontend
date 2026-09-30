const odooClient = require('../services/odooClient');

/**
 * Découvre dynamiquement les libellés du champ "state" (Brouillon, Validée,
 * Payée...) plutôt que de les deviner — comme pour les modèles de document.
 */
async function getStateLabels(session) {
  const fields = await odooClient.execute(
    'account.invoice',
    'fields_get',
    [['state']],
    { attributes: ['selection'] },
    session
  );
  return Object.fromEntries(fields.state.selection);
}

/**
 * Trouve le journal comptable adapté au type de facture (Ventes pour les
 * factures/avoirs clients, Achats pour les factures/avoirs fournisseurs).
 * Comme pricelist_id sur les Ventes, journal_id est obligatoire mais n'a
 * pas de valeur par défaut automatique en création via l'API.
 */
async function findJournalId(invoiceType, session) {
  const journalType = invoiceType.startsWith('out_') ? 'sale' : 'purchase';
  const journals = await odooClient.execute(
    'account.journal',
    'search',
    [[['type', '=', journalType]]],
    { limit: 1 },
    session
  );
  return journals.length > 0 ? journals[0] : false;
}

/**
 * GET /api/invoices/overview
 * Les chiffres de la "Vue d'ensemble" : factures à valider / impayées,
 * pour les clients et les fournisseurs.
 */
async function getOverview(req, res) {
  try {
    const session = req.odooSession;

    async function summarize(type) {
      const draft = await odooClient.execute(
        'account.invoice', 'search_read',
        [[['type', '=', type], ['state', '=', 'draft']]],
        { fields: ['amount_total'] },
        session
      );
      const unpaid = await odooClient.execute(
        'account.invoice', 'search_read',
        [[['type', '=', type], ['state', '=', 'open']]],
        { fields: ['residual'] },
        session
      );
      return {
        toValidate: { count: draft.length, total: draft.reduce((s, i) => s + i.amount_total, 0) },
        unpaid: { count: unpaid.length, total: unpaid.reduce((s, i) => s + i.residual, 0) },
      };
    }

    const customerInvoices = await summarize('out_invoice');
    const supplierBills = await summarize('in_invoice');

    res.json({ success: true, data: { customerInvoices, supplierBills } });
  } catch (error) {
    console.error('Erreur getOverview:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer la vue d'ensemble", error: error.message });
  }
}

/**
 * GET /api/invoices?type=out_invoice
 * type : out_invoice | out_refund | in_invoice | in_refund
 */
async function getInvoices(req, res) {
  try {
    const { type } = req.query;
    const session = req.odooSession;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Le type de facture est obligatoire' });
    }

    const invoices = await odooClient.execute(
      'account.invoice',
      'search_read',
      [[['type', '=', type]]],
      {
        fields: ['id', 'name', 'number', 'partner_id', 'date_invoice', 'date_due', 'amount_total', 'residual', 'state'],
        order: 'create_date desc',
      },
      session
    );

    const stateLabels = await getStateLabels(session);
    const withLabels = invoices.map((inv) => ({ ...inv, state_label: stateLabels[inv.state] || inv.state }));

    res.json({ success: true, data: withLabels });
  } catch (error) {
    console.error('Erreur getInvoices:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les factures', error: error.message });
  }
}

/**
 * GET /api/invoices/:id
 */
async function getInvoiceDetail(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const invoices = await odooClient.execute(
      'account.invoice', 'read', [[Number(id)]],
      {
        fields: [
          'name', 'number', 'type', 'partner_id', 'date_invoice', 'date_due',
          'amount_untaxed', 'amount_tax', 'amount_total', 'residual', 'state',
          'invoice_line_ids', 'access_url', 'company_id',
          'payment_term_id', 'user_id', 'team_id', 'sent',
        ],
      },
      session
    );

    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Facture introuvable' });
    }

    const payment = invoices[0];

    // Fetch partner address details from res.partner
    let partnerAddress = null;
    if (payment.partner_id) {
      const partnerId = Array.isArray(payment.partner_id) ? payment.partner_id[0] : payment.partner_id;
      const partner = await odooClient.execute(
        'res.partner', 'read', [[Number(partnerId)]],
        { fields: ['street', 'street2', 'city', 'zip', 'country_id'] },
        session
      );
      partnerAddress = partner.length > 0 ? partner[0] : null;
    }

    const stateLabels = await getStateLabels(session);
    const invoice = {
      ...payment,
      state_label: stateLabels[payment.state] || payment.state,
      partner_address: partnerAddress,
    };

    const lines = await odooClient.execute(
      'account.invoice.line', 'read', [invoice.invoice_line_ids],
      { fields: ['product_id', 'name', 'quantity', 'price_unit', 'discount', 'invoice_line_tax_ids', 'price_subtotal'] },
      session
    );

    const allTaxIds = [...new Set(lines.flatMap((l) => l.invoice_line_tax_ids))];
    let taxNamesById = {};
    if (allTaxIds.length > 0) {
      const taxes = await odooClient.execute('account.tax', 'read', [allTaxIds], { fields: ['name'] }, session);
      taxNamesById = Object.fromEntries(taxes.map((t) => [t.id, t.name]));
    }
    const linesWithTaxNames = lines.map((l) => ({
      ...l,
      tax_names: l.invoice_line_tax_ids.map((tid) => taxNamesById[tid] || '?'),
    }));

    res.json({ success: true, data: { invoice, lines: linesWithTaxNames } });
  } catch (error) {
    console.error('Erreur getInvoiceDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le détail de la facture', error: error.message });
  }
}

async function buildInvoiceLineCommands(lines, session) {
  const productIds = lines.map((l) => Number(l.productId));
  const products = await odooClient.execute('product.product', 'read', [productIds], { fields: ['name'] }, session);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return lines.map((line) => {
    const product = productsById[Number(line.productId)];
    return [
      0, 0,
      {
        product_id: Number(line.productId),
        name: product.name,
        quantity: Number(line.quantity),
        price_unit: Number(line.priceUnit),
        discount: Number(line.discount) || 0,
        invoice_line_tax_ids: line.taxId ? [[6, 0, [Number(line.taxId)]]] : [[6, 0, []]],
      },
    ];
  });
}

/**
 * POST /api/invoices
 * Body : { type, partnerId, dateInvoice, dueDate, lines: [...] }
 */
async function createInvoice(req, res) {
  try {
    const { type, partnerId, dateInvoice, dueDate, lines } = req.body;

    if (!type) return res.status(400).json({ success: false, message: 'Le type de facture est obligatoire' });
    if (!partnerId) return res.status(400).json({ success: false, message: 'Le client/fournisseur est obligatoire' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Ajoute au moins une ligne à la facture' });
    }

    const session = req.odooSession;
    const journalId = await findJournalId(type, session);
    const lineCommands = await buildInvoiceLineCommands(lines, session);

    const newId = await odooClient.execute(
      'account.invoice', 'create',
      [
        {
          type,
          partner_id: Number(partnerId),
          journal_id: journalId,
          date_invoice: dateInvoice || false,
          date_due: dueDate || false,
          invoice_line_ids: lineCommands,
        },
      ],
      {},
      session
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createInvoice:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de créer la facture', error: error.message });
  }
}

/**
 * PUT /api/invoices/:id
 */
async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const { partnerId, dateInvoice, dueDate, lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Ajoute au moins une ligne à la facture' });
    }

    const session = req.odooSession;
    const lineCommands = await buildInvoiceLineCommands(lines, session);

    await odooClient.execute(
      'account.invoice', 'write',
      [
        [Number(id)],
        {
          partner_id: Number(partnerId),
          date_invoice: dateInvoice || false,
          date_due: dueDate || false,
          invoice_line_ids: [[5, 0, 0], ...lineCommands],
        },
      ],
      {},
      session
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateInvoice:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier la facture (déjà validée ?)', error: error.message });
  }
}

async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.invoice', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteInvoice:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de supprimer (facture déjà validée ?)', error: error.message });
  }
}

/**
 * POST /api/invoices/:id/confirm
 * Valide le brouillon (le rend officielle) — méthode Odoo à ajuster si le
 * message d'erreur indique un nom différent selon ta version.
 */
async function confirmInvoice(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.invoice', 'action_invoice_open', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur confirmInvoice:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de valider la facture', error: error.message });
  }
}

async function cancelInvoice(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.invoice', 'action_invoice_cancel', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur cancelInvoice:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'annuler la facture", error: error.message });
  }
}

async function duplicateInvoice(req, res) {
  try {
    const { id } = req.params;
    const newId = await odooClient.execute('account.invoice', 'copy', [[Number(id)], {}], {}, req.odooSession);
    res.json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur duplicateInvoice:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de dupliquer la facture', error: error.message });
  }
}

async function getShareLink(req, res) {
  try {
    const { id } = req.params;
    const odooConfig = require('../config/odoo.config');
    const invoices = await odooClient.execute('account.invoice', 'read', [[Number(id)]], { fields: ['access_url'] }, req.odooSession);
    if (invoices.length === 0) return res.status(404).json({ success: false, message: 'Facture introuvable' });
    const shareUrl = `${odooConfig.url}:${odooConfig.port}${invoices[0].access_url}`;
    res.json({ success: true, url: shareUrl });
  } catch (error) {
    console.error('Erreur getShareLink:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de générer le lien de partage', error: error.message });
  }
}

/**
 * POST /api/invoices/:id/send
 * Simplifié : marque la facture comme "envoyée" (champ sent), sans réel envoi d'email.
 */
async function sendInvoice(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.invoice', 'write', [[Number(id)], { sent: true }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sendInvoice:', error.message);
    res.status(500).json({ success: false, message: "Impossible de marquer la facture comme envoyée", error: error.message });
  }
}

/**
 * POST /api/invoices/:id/reset-draft
 * "Remettre au Brouillon"
 */
async function resetInvoiceToDraft(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.invoice', 'action_invoice_draft', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur resetInvoiceToDraft:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de remettre au brouillon', error: error.message });
  }
}

/**
 * POST /api/invoices/:id/add-refund
 * "Ajouter un avoir" : crée un nouvel avoir (même partenaire, mêmes lignes).
 */
async function addRefund(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const original = await odooClient.execute('account.invoice', 'read', [[Number(id)]], { fields: ['type', 'partner_id', 'invoice_line_ids'], }, session);
    if (original.length === 0) return res.status(404).json({ success: false, message: 'Facture introuvable' });

    const refundType = original[0].type === 'out_invoice' ? 'out_refund' : 'in_refund';
    const journalId = await findJournalId(refundType, session);

    const lines = await odooClient.execute('account.invoice.line', 'read', [original[0].invoice_line_ids], { fields: ['product_id', 'name', 'quantity', 'price_unit', 'discount', 'invoice_line_tax_ids'] }, session);
    const lineCommands = lines.map((l) => [0, 0, {
      product_id: l.product_id ? l.product_id[0] : false,
      name: l.name,
      quantity: l.quantity,
      price_unit: l.price_unit,
      discount: l.discount,
      invoice_line_tax_ids: [[6, 0, l.invoice_line_tax_ids]],
    }]);

    const newId = await odooClient.execute('account.invoice', 'create', [{
      type: refundType,
      partner_id: original[0].partner_id[0],
      journal_id: journalId,
      invoice_line_ids: lineCommands,
    }], {}, session);

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur addRefund:', error.message);
    res.status(500).json({ success: false, message: "Impossible de créer l'avoir", error: error.message });
  }
}

/**
 * GET /api/invoices/:id/messages — historique (chatter)
 */
async function getInvoiceMessages(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;
    const messages = await odooClient.execute(
      'mail.message', 'search_read',
      [[['res_id', '=', Number(id)], ['model', '=', 'account.invoice']]],
      { fields: ['id', 'author_id', 'body', 'date'], order: 'date desc' },
      session
    );
    const enriched = messages.map((m) => ({
      id: m.id,
      author: m.author_id ? m.author_id[1] : 'Système',
      date: m.date,
      body: (m.body || '').replace(/<[^>]*>/g, '').trim(),
    }));
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erreur getInvoiceMessages:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer l'historique", error: error.message });
  }
}

/**
 * POST /api/invoices/:id/messages
 */
async function postInvoiceMessage(req, res) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ success: false, message: 'Message vide' });
    await odooClient.execute('account.invoice', 'message_post', [[Number(id)]], { body }, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur postInvoiceMessage:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'ajouter le message", error: error.message });
  }
}

module.exports = {
  getOverview, getInvoices, getInvoiceDetail, createInvoice, updateInvoice,
  deleteInvoice, confirmInvoice, cancelInvoice, duplicateInvoice, getShareLink,
  sendInvoice, resetInvoiceToDraft, addRefund, getInvoiceMessages, postInvoiceMessage,
};