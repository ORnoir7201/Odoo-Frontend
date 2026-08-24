/**
 * Petit script pour explorer les champs d'un modèle Odoo.
 * Usage : node explore-fields.js product.product
 *         node explore-fields.js res.partner
 *
 * Utile quand tu veux savoir "comment s'appelle ce champ dans le code"
 * sans devoir passer par le mode développeur d'Odoo.
 */
require('dotenv').config();
const odooClient = require('./src/services/odooClient');

const model = process.argv[2];

if (!model) {
  console.log('Usage: node explore-fields.js <nom_du_modele>');
  console.log('Exemple: node explore-fields.js product.product');
  process.exit(1);
}

async function main() {
  const fields = await odooClient.executeAsService(model, 'fields_get', [], {
    attributes: ['string', 'type', 'relation', 'required'],
  });

  console.log(`\nChamps du modèle "${model}" :\n`);

  Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([technicalName, info]) => {
      const relation = info.relation ? ` → ${info.relation}` : '';
      const required = info.required ? ' [obligatoire]' : '';
      console.log(`${technicalName.padEnd(30)} (${info.type}${relation})  "${info.string}"${required}`);
    });
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});