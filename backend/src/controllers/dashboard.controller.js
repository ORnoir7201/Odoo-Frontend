const odooClient = require('../services/odooClient');

/**
 * GET /api/dashboard/stats
 *
 * Agrège les statistiques de tous les modules déjà connectés.
 * Conçu pour grandir facilement : quand un nouveau module est ajouté
 * (ex: commandes de vente), on ajoute simplement un nouveau bloc ici,
 * sans toucher au reste — le frontend affichera automatiquement
 * une nouvelle carte pour peu qu'on la décrive dans la réponse.
 */
async function getStats(req, res) {
  try {
    const session = req.odooSession;

    const [contactsTotal, suppliersTotal, purchasersTotal, salesTotal, recentContacts, allProducts, recentProducts] = await Promise.all([
      // Nombre total de contacts
      odooClient.execute('res.partner', 'search_count', [[]], {}, session),

      // Nombre total de fournisseurs
      odooClient.execute('res.partner', 'search_count', [[['supplier', '=', true]]], {}, session),

      //nombre total de comandes d'achat
      odooClient.execute('purchase.order', 'search_count', [[]], {}, session),

      //nombre total de ventes
      odooClient.execute('sale.order', 'search_count', [[]], {}, session),

      // 5 derniers contacts créés
      odooClient.execute(
        'res.partner',
        'search_read',
        [[]],
        { fields: ['id', 'name', 'create_date'], order: 'create_date desc', limit: 5 },
        session
      ),

      // Tous les produits (juste prix + stock) pour calculer la valeur totale du stock
      odooClient.execute(
        'product.product',
        'search_read',
        [[]],
        { fields: ['list_price', 'qty_available'] },
        session
      ),

      // 5 derniers produits créés
      odooClient.execute(
        'product.product',
        'search_read',
        [[]],
        { fields: ['id', 'name', 'create_date'], order: 'create_date desc', limit: 5 },
        session
      ),
    ]);

    

    res.json({
      success: true,
      data: {
        contacts: {
          total: contactsTotal,
          recent: recentContacts,
        },
        suppliers: {
          total: suppliersTotal,
        },
        purchasers: {
          total: purchasersTotal,
        },

        sales: {
          total: salesTotal,
        },
        products: {
          total: allProducts.length,
          
          recent: recentProducts,
        },
      },
    });
  } catch (error) {
    console.error('Erreur getStats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Impossible de récupérer les statistiques depuis Odoo',
      error: error.message,
    });
  }
}

module.exports = {
  getStats,
};