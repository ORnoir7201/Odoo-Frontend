import { useEffect, useState } from 'react';
import { getSuppliers } from '../api/suppliers';
import { getProducts } from '../api/products';
import { getCompanies } from '../api/companies';
import { getTaxes } from '../api/taxes';
import {getBuyers} from '../api/buyers';

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  return { key: lineKeyCounter, productId: '', quantity: 1, priceUnit: '', taxId: '' };
}

export default function PurchaseForm({ editingOrder, editingLines, onSubmit, onCancel, isSubmitting }) {
  const [suppliers, setSuppliers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const isEditing = Boolean(editingOrder);

  const [partnerId, setPartnerId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [userId, setUserId] = useState('');
  const [dateOrder, setDateOrder] = useState(nowForInput());
  const [datePlanned, setDatePlanned] = useState(nowForInput());
  const [lines, setLines] = useState([newLine()]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSuppliers().then(setSuppliers).catch((err) => console.error('Fournisseurs:', err.message));
    getCompanies().then(setCompanies).catch((err) => console.error('Sociétés:', err.message));
    getProducts().then(setProducts).catch((err) => console.error('Produits:', err.message));
    getTaxes().then(setTaxes).catch((err) => console.error('Taxes:', err.message));
    getBuyers().then(setBuyers).catch((err) => console.error('Acheteurs:', err.message));
  }, []);

  // Pré-remplissage du formulaire quand on ouvre en mode "Modifier"
  useEffect(() => {
    if (!editingOrder) return;
    setPartnerId(editingOrder.partner_id ? String(editingOrder.partner_id[0]) : '');
    setCompanyId(editingOrder.company_id ? String(editingOrder.company_id[0]) : '');
    setUserId(editingOrder.user_id ? String(editingOrder.user_id[0]) : '');
    setDateOrder(toInputDatetime(editingOrder.date_order));
    setDatePlanned(toInputDatetime(editingOrder.date_planned));
    if (editingLines && editingLines.length > 0) {
      setLines(
        editingLines.map((l) => {
          lineKeyCounter += 1;
          return {
            key: lineKeyCounter,
            productId: l.product_id ? String(l.product_id[0]) : '',
            quantity: l.product_qty,
            priceUnit: String(l.price_unit),
            taxId: l.taxes_id && l.taxes_id.length > 0 ? String(l.taxes_id[0]) : '',
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
    updateLine(key, {
      productId,
      priceUnit: product ? String(product.list_price) : '',
    });
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(key) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  // Calcul automatique HT / Taxes / TTC, comme le fait Odoo en temps réel
  const taxRateById = Object.fromEntries(taxes.map((t) => [String(t.id), t.amount]));

  const computedLines = lines.map((l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.priceUnit) || 0;
    const subtotal = qty * price;
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

    if (!partnerId) return setError('Sélectionne un fournisseur.');
    if (!companyId) return setError('Sélectionne une société.');

    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (validLines.length === 0) return setError('Ajoute au moins un produit avec une quantité valide.');

    try {
      await onSubmit({
        partnerId: Number(partnerId),
        companyId: Number(companyId),
        userId: Number(userId),
        dateOrder: toOdooDatetime(dateOrder),
        datePlanned: toOdooDatetime(datePlanned),
        lines: validLines.map((l) => ({
          productId: Number(l.productId),
          quantity: Number(l.quantity),
          priceUnit: Number(l.priceUnit) || 0,
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
          <span className="field__label">Fournisseur</span>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Société</span>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Responsable Achats</span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Date de la commande</span>
          <input type="datetime-local" value={dateOrder} onChange={(e) => setDateOrder(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">Date prévue</span>
          <input type="datetime-local" value={datePlanned} onChange={(e) => setDatePlanned(e.target.value)} />
        </label>
      </div>

      <p className="client-form__section-label">Produits</p>

      <div className="order-lines">
        <div className="order-lines__rows">
          {computedLines.map((line) => (
            <div className="order-line-row" key={line.key}>
              <label className="field">
                <span className="field__label">Produit</span>
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
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : 'Créer la commande'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}