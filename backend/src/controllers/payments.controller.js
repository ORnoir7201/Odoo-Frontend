const odooClient = require('../services/odooClient');

async function getPaymentStateLabels(session) {
  const fields = await odooClient.execute('account.payment', 'fields_get', [['state']], { attributes: ['selection'] }, session);
  return Object.fromEntries(fields.state.selection);
}

/**
 * GET /api/payments?partnerType=customer|supplier
 */
async function getPayments(req, res) {
  try {
    const { partnerType } = req.query;
    const session = req.odooSession;

    if (!partnerType) {
      return res.status(400).json({ success: false, message: 'partnerType est obligatoire' });
    }

    const payments = await odooClient.execute(
      'account.payment', 'search_read',
      [[['partner_type', '=', partnerType]]],
      { fields: ['id', 'name', 'partner_id', 'payment_date', 'amount', 'payment_type', 'state', 'communication'], order: 'create_date desc' },
      session
    );

    const stateLabels = await getPaymentStateLabels(session);
    const withLabels = payments.map((p) => ({ ...p, state_label: stateLabels[p.state] || p.state }));

    res.json({ success: true, data: withLabels });
  } catch (error) {
    console.error('Erreur getPayments:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les paiements', error: error.message });
  }
}

/**
 * GET /api/payments/unpaid-invoices?partnerId=5&partnerType=customer
 * Liste les factures non soldées de ce partenaire, pour choisir lesquelles régler.
 */
async function getUnpaidInvoices(req, res) {
  try {
    const { partnerId, partnerType } = req.query;
    const session = req.odooSession;

    const invoiceTypes = partnerType === 'customer' ? ['out_invoice', 'out_refund'] : ['in_invoice', 'in_refund'];

    const invoices = await odooClient.execute(
      'account.invoice', 'search_read',
      [[['partner_id', '=', Number(partnerId)], ['type', 'in', invoiceTypes], ['state', '=', 'open']]],
      { fields: ['id', 'number', 'name', 'amount_total', 'residual'] },
      session
    );

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Erreur getUnpaidInvoices:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les factures impayées', error: error.message });
  }
}

/**
 * GET /api/payments/:id
 */
async function getPaymentDetail(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const payments = await odooClient.execute(
      'account.payment', 'read', [[Number(id)]],
      { fields: ['name', 'partner_id', 'partner_type', 'payment_type', 'amount', 'payment_date', 'communication', 'journal_id', 'payment_method_id', 'state', 'invoice_ids'] },
      session
    );

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Paiement introuvable' });
    }

    const payment = payments[0];

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

    const stateLabels = await getPaymentStateLabels(session);
    const typeLabels = await getPaymentTypeLabels(session);
    const withAddress = {
      ...payment,
      state_label: stateLabels[payment.state] || payment.state,
      payment_type_label: typeLabels[payment.payment_type] || payment.payment_type,
      partner_address: partnerAddress,
    };

    let invoices = [];
    if (withAddress.invoice_ids.length > 0) {
      invoices = await odooClient.execute(
        'account.invoice', 'read', [withAddress.invoice_ids],
        { fields: ['number', 'name', 'date_invoice', 'amount_total', 'residual'] },
        session
      );
    }

    res.json({ success: true, data: { payment: withAddress, invoices } });
  } catch (error) {
    console.error('Erreur getPaymentDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le paiement', error: error.message });
  }
}

/**
 * POST /api/payments
 * Body : { partnerType, partnerId, amount, paymentDate, communication, invoiceIds: [...] }
 */
async function createPayment(req, res) {
  try {
    const { partnerType, partnerId, amount, paymentDate, communication, invoiceIds } = req.body;

    if (!partnerType) return res.status(400).json({ success: false, message: 'partnerType obligatoire' });
    if (!partnerId) return res.status(400).json({ success: false, message: 'Le partenaire est obligatoire' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Le montant doit être positif' });

    const session = req.odooSession;
    const paymentType = partnerType === 'customer' ? 'inbound' : 'outbound';

    const journals = await odooClient.execute('account.journal', 'search', [[['type', 'in', ['bank', 'cash']]]], { limit: 1 }, session);
    const journalId = journals.length > 0 ? journals[0] : false;

    const methods = await odooClient.execute('account.payment.method', 'search', [[['payment_type', '=', paymentType]]], { limit: 1 }, session);
    const methodId = methods.length > 0 ? methods[0] : false;

    const newId = await odooClient.execute(
      'account.payment', 'create',
      [
        {
          payment_type: paymentType,
          partner_type: partnerType,
          partner_id: Number(partnerId),
          amount: Number(amount),
          payment_date: paymentDate,
          communication: communication || false,
          journal_id: journalId,
          payment_method_id: methodId,
          invoice_ids: Array.isArray(invoiceIds) && invoiceIds.length > 0 ? [[6, 0, invoiceIds.map(Number)]] : [[6, 0, []]],
        },
      ],
      {},
      session
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createPayment:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de créer le paiement', error: error.message });
  }
}

/**
 * POST /api/payments/:id/confirm
 * Valide le paiement et déclenche le rapprochement avec les factures liées.
 */
async function confirmPayment(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.payment', 'post', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur confirmPayment:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de valider le paiement', error: error.message });
  }
}

async function cancelPayment(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.payment', 'cancel', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur cancelPayment:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'annuler le paiement", error: error.message });
  }
}

async function deletePayment(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.payment', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deletePayment:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de supprimer (paiement déjà validé ?)', error: error.message });
  }
}
async function getPaymentTypeLabels(session) {
  const fields = await odooClient.execute('account.payment', 'fields_get', [['payment_type']], { attributes: ['selection'] }, session);
  return Object.fromEntries(fields.payment_type.selection);
}

/**
 * PUT /api/payments/:id — modification (uniquement tant que brouillon)
 */
async function updatePayment(req, res) {
  try {
    const { id } = req.params;
    const { amount, paymentDate, communication, invoiceIds } = req.body;

    const updateData = {
      amount: Number(amount),
      payment_date: paymentDate,
      communication: communication || false,
    };
    if (Array.isArray(invoiceIds)) {
      updateData.invoice_ids = [[6, 0, invoiceIds.map(Number)]];
    }

    await odooClient.execute('account.payment', 'write', [[Number(id)], updateData], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updatePayment:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier le paiement', error: error.message });
  }
}

/**
 * POST /api/payments/:id/send-receipt
 * Simplifié : ajoute une note dans l'historique, sans réel envoi d'email.
 */
async function sendReceipt(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute(
      'account.payment', 'message_post', [[Number(id)]],
      { body: 'Reçu envoyé par courriel (simulation — aucun email réel envoyé).' },
      req.odooSession
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sendReceipt:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'enregistrer l'envoi du reçu", error: error.message });
  }
}

/**
 * POST /api/payments/:id/reset-draft
 */
async function resetPaymentToDraft(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('account.payment', 'write', [[Number(id)], { state: 'draft' }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur resetPaymentToDraft:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de remettre au brouillon', error: error.message });
  }
}

/**
 * GET/POST /api/payments/:id/messages — chatter
 */
async function getPaymentMessages(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;
    const messages = await odooClient.execute(
      'mail.message', 'search_read',
      [[['res_id', '=', Number(id)], ['model', '=', 'account.payment']]],
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
    console.error('Erreur getPaymentMessages:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer l'historique", error: error.message });
  }
}

async function postPaymentMessage(req, res) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ success: false, message: 'Message vide' });
    await odooClient.execute('account.payment', 'message_post', [[Number(id)]], { body }, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur postPaymentMessage:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'ajouter le message", error: error.message });
  }
}

module.exports = {
  getPayments, getUnpaidInvoices, getPaymentDetail, createPayment,
  confirmPayment, cancelPayment, deletePayment,
  updatePayment, sendReceipt, resetPaymentToDraft, getPaymentMessages, postPaymentMessage,
};