import { useEffect, useState } from 'react';
import { getClients } from '../api/clients';
import { getSuppliers } from '../api/suppliers';
import { getProducts } from '../api/products';
import { getSaleTaxes } from '../api/sales';
//import { getTaxes as getPurchaseTaxes } from '../api/purchases';

function todayForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

let lineKeyCounter = 0;
function newLine() {
  lineKeyCounter += 1;
  return { key: lineKeyCounter, productId: '', quantity: 1, priceUnit: '', discount: 0, taxId: '' };
}

export default function InvoiceForm({ type, editingInvoice, editingLines, onSubmit, onCancel, isSubmitting }) {
  const isCustomerType = type.startsWith('out_');
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const [partnerId, setPartnerId] = useState('');
  const [dateInvoice, setDateInvoice] = useState(todayForInput());
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState([newLine()]);
  const [error, setError] = useState(null);

  const isEditing = Boolean(editingInvoice);

  useEffect(() => {
    (isCustomerType ? getClients(false) : getSuppliers()).then(setPartners).catch((err) => console.error('Partenaires:', err.message));
    getProducts().then(setProducts).catch((err) => console.error('Produits:', err.message));
    (isCustomerType ? getSaleTaxes() : getPurchaseTaxes()).then(setTaxes).catch((err) => console.error('Taxes:', err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editingInvoice) return;
    setPartnerId(editingInvoice.partner_id ? String(editingInvoice.partner_id[0]) : '');
    setDateInvoice(editingInvoice.date_invoice || todayForInput());
    setDueDate(editingInvoice.date_due || '');
    if (editingLines && editingLines.length > 0) {
      setLines(editingLines.map((l) => {
        lineKeyCounter += 1;
        return {
          key: lineKeyCounter,
          productId: l.product_id ? String(l.product_id[0]) : '',
          quantity: l.quantity,
          priceUnit: String(l.price_unit),
          discount: l.discount || 0,
          taxId: l.invoice_line_tax_ids && l.invoice_line_tax_ids.length > 0 ? String(l.invoice_line_tax_ids[0]) : '',
        };
      }));
    }
  }, [editingInvoice, editingLines]);

  function updateLine(key, changes) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  }

  function handleProductChange(key, productId) {
    const product = products.find((p) => String(p.id) === productId);
    updateLine(key, { productId, priceUnit: product ? String(product.list_price) : '',
      description: product ? (isCustomerType ? (product.description_sale || product.name) : (product.description_purchase || product.name)) : '',
     });
  }

  function addLine() { setLines((prev) => [...prev, newLine()]); }
  function removeLine(key) { setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev)); }

  const taxRateById = Object.fromEntries(taxes.map((t) => [String(t.id), t.amount]));
  const computedLines = lines.map((l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.priceUnit) || 0;
    const discountPct = Number(l.discount) || 0;
    const subtotal = qty * price * (1 - discountPct / 100);
    const rate = l.taxId ? taxRateById[l.taxId] || 0 : 0;
    const taxAmount = subtotal * (rate / 100);
    return { ...l, subtotal, taxAmount, total: subtotal + taxAmount };
  });
  const totalUntaxed = computedLines.reduce((s, l) => s + l.subtotal, 0);
  const totalTax = computedLines.reduce((s, l) => s + l.taxAmount, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!partnerId) return setError(isCustomerType ? 'Sélectionne un client.' : 'Sélectionne un fournisseur.');
    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) return setError('Ajoute au moins un produit.');

    try {
      await onSubmit({
        type,
        partnerId: Number(partnerId),
        dateInvoice,
        dueDate: dueDate || null,
        lines: validLines.map((l) => ({
          productId: Number(l.productId),
          quantity: Number(l.quantity),
          priceUnit: Number(l.priceUnit) || 0,
          discount: Number(l.discount) || 0,
          taxId: l.taxId ? Number(l.taxId) : null,
        })),
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="client-form__grid">
        <label className="field">
          <span className="field__label">{isCustomerType ? 'Client' : 'Fournisseur'}</span>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Date de facture</span>
          <input type="date" value={dateInvoice} onChange={(e) => setDateInvoice(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Date d'échéance</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>

      <p className="client-form__section-label">Article</p>
      <div className="order-lines">
        <div className="order-lines__rows">
          {computedLines.map((line) => (
            <div className="order-line-row order-line-row--sale" key={line.key}>
              <label className="field">
                <span className="field__label">Article</span>
                <select value={line.productId} onChange={(e) => handleProductChange(line.key, e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Quantité</span>
                <input type="number" min="1" step="1" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} />
              </label>
              <label className="field">
                <span className="field__label">Prix unitaire</span>
                <input type="number" min="0" step="0.01" value={line.priceUnit} onChange={(e) => updateLine(line.key, { priceUnit: e.target.value })} />
              </label>
              <label className="field">
                <span className="field__label">Remise (%)</span>
                <input type="number" min="0" max="100" step="1" value={line.discount} onChange={(e) => updateLine(line.key, { discount: e.target.value })} />
              </label>
              <label className="field">
                <span className="field__label">Taxe</span>
                <select value={line.taxId} onChange={(e) => updateLine(line.key, { taxId: e.target.value })}>
                  <option value="">Aucune</option>
                  {taxes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Sous-total</span>
                <input type="text" disabled value={line.total.toLocaleString('fr-FR')} />
              </label>
              <button type="button" className="order-line-row__remove" onClick={() => removeLine(line.key)}>×</button>
            </div>
          ))}
        </div>
        <div className="order-lines__total order-lines__total--breakdown">
          <span>Hors taxe : {totalUntaxed.toLocaleString('fr-FR')} FCFA</span>
          <span>Taxes : {totalTax.toLocaleString('fr-FR')} FCFA</span>
          <span>Total : <strong>{(totalUntaxed + totalTax).toLocaleString('fr-FR')} FCFA</strong></span>
        </div>
      </div>

      <button type="button" className="btn btn--ghost" onClick={addLine} style={{ marginBottom: 20 }}>+ Ajouter une ligne</button>

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Créer'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}