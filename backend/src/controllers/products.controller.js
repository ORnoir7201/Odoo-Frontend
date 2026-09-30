const odooClient = require('../services/odooClient');

/**
 * Traduit le type technique Odoo en libellé français (comme sur ta capture :
 * Stockable / Consommable / Service).
 */
const TYPE_LABELS = {
  consu: 'Consommable',
  service: 'Service',
  product: 'Stockable',
};

async function findOrCreateCategoryId(categoryName, session) {
  if (!categoryName || !categoryName.trim()) {
    return false;
  }

  const trimmedName = categoryName.trim();

  const results = await odooClient.execute(
    'product.category',
    'search',
    [[['name', 'ilike', trimmedName]]],
    { limit: 1 },
    session
  );

  if (results.length > 0) {
    return results[0];
  }

  const newCategoryId = await odooClient.execute(
    'product.category',
    'create',
    [{ name: trimmedName }],
    {},
    session
  );

  return newCategoryId;
}

async function findCompanyId(companyName, session) {
  if (!companyName || !companyName.trim()) {
    return false;
  }

  const results = await odooClient.execute(
    'res.company',
    'search',
    [[['name', 'ilike', companyName.trim()]]],
    { limit: 1 },
    session
  );

  return results.length > 0 ? results[0] : false;
}

/**
 * GET /api/products
 * Liste allégée (pas de photo, pour ne pas alourdir la liste).
 */
async function getProducts(req, res) {
  try {
    const products = await odooClient.execute(
      'product.product',
      'search_read',
      [[]],
      {
        fields: [
          'id', 'name', 'default_code', 'barcode', 'type', 'list_price',
          'standard_price', 'qty_available', 'categ_id', 'company_id', 'description_sale', 'description_purchase',
        ],
        order: 'create_date desc',
      },
      req.odooSession
    );

    const withLabels = products.map((p) => ({ ...p, type_label: TYPE_LABELS[p.type] || p.type }));
    res.json({ success: true, data: withLabels });
  } catch (error) {
    console.error('Erreur getProducts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les produits depuis Odoo',
      error: error.message,
    });
  }
}

/**
 * GET /api/products/:id
 * Détail complet, avec photo et taxes.
 */
async function getProductDetail(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;

    const products = await odooClient.execute(
      'product.product',
      'read',
      [[Number(id)]],
      {
        fields: [
          'name', 'default_code', 'barcode', 'type', 'list_price', 'standard_price',
          'qty_available', 'categ_id', 'company_id', 'sale_ok', 'purchase_ok',
          'taxes_id', 'description_sale', 'image',  'description_purchase',
        ],
      },
      session
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    const product = { ...products[0], type_label: TYPE_LABELS[products[0].type] || products[0].type };
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Erreur getProductDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le produit', error: error.message });
  }
}

/**
 * POST /api/products
 * Body : { name, reference, barcode, type, price, cost, category, company,
 *          taxId, saleOk, purchaseOk, descriptionSale, photoBase64 }
 */
async function createProduct(req, res) {
  try {
    const {
      name, reference, barcode, type, price, cost, category, company,
      taxId, saleOk, purchaseOk, descriptionSale, photoBase64,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est obligatoire' });
    }

    const session = req.odooSession;
    const categId = await findOrCreateCategoryId(category, session);
    const companyId = await findCompanyId(company, session);

    const newId = await odooClient.execute(
      'product.product',
      'create',
      [
        {
          name,
          default_code: reference || false,
          barcode: barcode || false,
          type: type || 'consu',
          list_price: price ? Number(price) : 0,
          standard_price: cost ? Number(cost) : 0,
          categ_id: categId,
          company_id: companyId,
          sale_ok: saleOk !== false,
          purchase_ok: purchaseOk !== false,
          taxes_id: taxId ? [[6, 0, [Number(taxId)]]] : [[6, 0, []]],
          description_sale: descriptionSale || false,
          image: photoBase64 || false,
        },
      ],
      {},
      session
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createProduct:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de créer le produit dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * PUT /api/products/:id
 */
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name, reference, barcode, type, price, cost, category, company,
      taxId, saleOk, purchaseOk, descriptionSale, photoBase64,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est obligatoire' });
    }

    const session = req.odooSession;
    const categId = await findOrCreateCategoryId(category, session);
    const companyId = await findCompanyId(company, session);

    const updateData = {
      name,
      default_code: reference || false,
      barcode: barcode || false,
      type: type || 'consu',
      list_price: price ? Number(price) : 0,
      standard_price: cost ? Number(cost) : 0,
      sale_ok: saleOk !== false,
      purchase_ok: purchaseOk !== false,
      taxes_id: taxId ? [[6, 0, [Number(taxId)]]] : [[6, 0, []]],
      description_sale: descriptionSale || false,
    };

    if (categId) updateData.categ_id = categId;
    if (companyId) updateData.company_id = companyId;
    if (photoBase64) updateData.image = photoBase64;

    await odooClient.execute('product.product', 'write', [[Number(id)], updateData], {}, session);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateProduct:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de modifier le produit dans Odoo (vérifie que ton compte a les droits nécessaires)',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/products/:id
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('product.product', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteProduct:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de supprimer le produit dans Odoo',
      error: error.message,
    });
  }
}

module.exports = {
  getProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
};