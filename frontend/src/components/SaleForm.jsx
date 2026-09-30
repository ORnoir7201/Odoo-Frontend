import { useEffect, useState } from 'react';
import { getClients } from '../api/clients';
import { getCompanies } from '../api/companies';
import { getSalespersons } from '../api/salespersons';
import { getProducts } from '../api/products';
import { getSaleTaxes, getPaymentTerms } from '../api/sales';

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toOdooDatetime(inputValue) {
  return inputValue.replace('T', ' ') + ':00';
}

function toInputDatetime(odooValue) {
  if (!odooValue) return nowForInput();
  return odooValue.replace(' ', 'T').slice(0, 16);
}

let lineKeyCounter = 0;
function newLine() {
  lineKeyCounter += 1;
  return { key: lineKeyCounter, productId: '', quantity: 1, priceUnit: '', discount: 0, taxId: '' };
}

export default function SaleForm({ editingOrder, editingLines, onSubmit, onCancel, isSubmitting }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [salespersons, setSalespersons] = useState([]);


  const isEditing = Boolean(editingOrder);
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [dateOrder, setDateOrder] = useState(nowForInput());
  const [validityDate, setValidityDate] = useState(todayForInput());
  const [paymentTermId, setPaymentTermId] = useState('');
  const [lines, setLines] = useState([newLine()]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getClients().then(setClients).catch((err) => console.error('Clients:', err.message));
    getCompanies().then(setCompanies).catch((err) => console.error('Sociétés:', err.message));
    getSalespersons().then(setSalespersons).catch((err) => console.error('Vendeurs:', err.message));
    getProducts().then(setProducts).catch((err) => console.error('Produits:', err.message));
    getSaleTaxes().then(setTaxes).catch((err) => console.error('Taxes:', err.message));
    getPaymentTerms().then(setPaymentTerms).catch((err) => console.error('Conditions de paiement:', err.message));
  }, []);

  useEffect(() => {
    if (!editingOrder) return;
    setUserId(editingOrder.user_id ? String(editingOrder.user_id[0]) : '');
    setCompanyId(editingOrder.company_id ? String(editingOrder.company_id[0]) : '');
    setPartnerId(editingOrder.partner_id ? String(editingOrder.partner_id[0]) : '');
    setDateOrder(toInputDatetime(editingOrder.date_order));
    setValidityDate(editingOrder.validity_date || todayForInput());
    setPaymentTermId(editingOrder.payment_term_id ? String(editingOrder.payment_term_id[0]) : '');
    if (editingLines && editingLines.length > 0) {
      setLines(
        editingLines.map((l) => {
          lineKeyCounter += 1;
          return {
            key: lineKeyCounter,
            productId: l.product_id ? String(l.product_id[0]) : '',
            quantity: l.product_uom_qty,
            priceUnit: String(l.price_unit),
            discount: l.discount || 0,
            taxId: l.tax_id && l.tax_id.length > 0 ? String(l.tax_id[0]) : '',
          };
        })
      );
    }
  }, [editingOrder, editingLines]);

  function updateLine(key, changes) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  }

  function handleProductChange(key, productId) {
    const product = products.find((p) => String(p.id) === productId);
    updateLine(key, { productId, priceUnit: product ? String(product.list_price) : '',
      description: product ? (product.description_sale || product.name) : '', });
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(key) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  const taxRateById = Object.fromEntries(taxes.map((t) => [String(t.id), t.amount]));

  const computedLines = lines.map((l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.priceUnit) || 0;
    const discountPct = Number(l.discount) || 0;
    const subtotalBeforeDiscount = qty * price;
    const subtotal = subtotalBeforeDiscount * (1 - discountPct / 100);
    const rate = l.taxId ? taxRateById[l.taxId] || 0 : 0;
    const taxAmount = subtotal * (rate / 100);
    return { ...l, subtotal, taxAmount, total: subtotal + taxAmount };
  });

  const totalUntaxed = computedLines.reduce((sum, l) => sum + l.subtotal, 0);
  const totalTax = computedLines.reduce((sum, l) => sum + l.taxAmount, 0);
  const totalWithTax = totalUntaxed + totalTax;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!partnerId) return setError('Sélectionne un client.');

    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) return setError('Ajoute au moins un produit avec une quantité valide.');

    try {
      await onSubmit({
        partnerId: Number(partnerId),
        userId: userId ? Number(userId) : null,
        companyId: companyId ? Number(companyId) : null,
        dateOrder: toOdooDatetime(dateOrder),
        validityDate: validityDate || null,
        paymentTermId: paymentTermId ? Number(paymentTermId) : null,
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
          <span className="field__label">Client</span>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value=""> Sélectionner</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Vendeur</span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Moi-même —</option>
            {salespersons.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Société</span>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">— Par défaut —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Date du devis</span>
          <input type="datetime-local" value={dateOrder} onChange={(e) => setDateOrder(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">Validité</span>
          <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
        </label>
              
        <label className="field">
          <span className="field__label">Conditions de paiement</span>
          <select value={paymentTermId} onChange={(e) => setPaymentTermId(e.target.value)}>
            <option value="">— Aucune —</option>
            {paymentTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="client-form__section-label">Articles</p>

      <div className="order-lines">
        <div className="order-lines__rows">
          {computedLines.map((line) => (
            <div className="order-line-row order-line-row--sale" key={line.key}>
              <label className="field">
                <span className="field__label">Article</span>
                <select value={line.productId} onChange={(e) => handleProductChange(line.key, e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Quantité</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                />
              </label>

              <label className="field">
                <span className="field__label">Prix unitaire</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.priceUnit}
                  onChange={(e) => updateLine(line.key, { priceUnit: e.target.value })}
                />
              </label>

              <label className="field">
                <span className="field__label">Remise (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={line.discount}
                  onChange={(e) => updateLine(line.key, { discount: e.target.value })}
                />
              </label>

              <label className="field">
                <span className="field__label">Taxe</span>
                <select value={line.taxId} onChange={(e) => updateLine(line.key, { taxId: e.target.value })}>
                  <option value="">Aucune</option>
                  {taxes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Sous-total</span>
                <input type="text" disabled value={line.total.toLocaleString('fr-FR')} />
              </label>

              <button
                type="button"
                className="order-line-row__remove"
                onClick={() => removeLine(line.key)}
                aria-label="Retirer cette ligne"
                title="Retirer cette ligne"
              >
                ×
              </button>
              
            </div>
          ))}
        </div>

        <div className="order-lines__total order-lines__total--breakdown">
          <span>Hors taxe : {totalUntaxed.toLocaleString('fr-FR')} FCFA</span>
          <span>Taxes : {totalTax.toLocaleString('fr-FR')} FCFA</span>
          <span>Total : <strong>{totalWithTax.toLocaleString('fr-FR')} FCFA</strong></span>
        </div>
      </div>

      <button type="button" className="btn btn--ghost" onClick={addLine} style={{ marginBottom: 20 }}>
        + Ajouter une ligne
      </button>

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : 'Créer le devis'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}