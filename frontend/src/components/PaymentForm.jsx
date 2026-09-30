import { useEffect, useState } from 'react';
import { getClients } from '../api/clients';
import { getSuppliers } from '../api/suppliers';
import { getUnpaidInvoices } from '../api/payments';

function todayForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function PaymentForm({ partnerType, initialPartnerId, initialInvoiceId, onSubmit, onCancel, isSubmitting }) {
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayForInput());
  const [communication, setCommunication] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    (partnerType === 'customer' ? getClients(false) : getSuppliers())
      .then((list) => {
        setPartners(list);
        if (initialPartnerId) setPartnerId(String(initialPartnerId));
      })
      .catch((err) => console.error('Partenaires:', err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerType]);

 useEffect(() => {
    if (!partnerId) {
      setUnpaidInvoices([]);
      return;
    }
    getUnpaidInvoices(partnerId, partnerType)
      .then((list) => {
        setUnpaidInvoices(list);
        if (initialInvoiceId) {
          const match = list.find((inv) => inv.id === initialInvoiceId);
          if (match) {
            setSelectedInvoiceIds([match.id]);
            setAmount(String(match.residual));
          }
        }
      })
      .catch((err) => console.error('Factures impayées:', err.message));
    if (!initialInvoiceId) setSelectedInvoiceIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, partnerType]);

  function toggleInvoice(invoiceId, residual) {
    setSelectedInvoiceIds((prev) => {
      const exists = prev.includes(invoiceId);
      const next = exists ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId];
      // Pré-remplit le montant avec la somme des factures cochées (modifiable ensuite).
      const total = unpaidInvoices
        .filter((inv) => next.includes(inv.id))
        .reduce((sum, inv) => sum + inv.residual, 0);
      setAmount(String(total));
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!partnerId) return setError(partnerType === 'customer' ? 'Sélectionne un client.' : 'Sélectionne un fournisseur.');
    if (!amount || Number(amount) <= 0) return setError('Le montant doit être positif.');

    try {
      await onSubmit({
        partnerType,
        partnerId: Number(partnerId),
        amount: Number(amount),
        paymentDate,
        communication,
        invoiceIds: selectedInvoiceIds,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="client-form__grid">
        <label className="field field--wide">
          <span className="field__label">{partnerType === 'customer' ? 'Client' : 'Fournisseur'}</span>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Montant</span>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Date</span>
          <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </label>
      </div>

      {partnerId && (
        <>
          <p className="client-form__section-label">Factures à régler (optionnel)</p>
          <div className="company-checklist" style={{ marginBottom: 16 }}>
            {unpaidInvoices.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Aucune facture impayée pour ce partenaire.</span>}
            {unpaidInvoices.map((inv) => (
              <label key={inv.id} className="company-checklist__item">
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.includes(inv.id)}
                  onChange={() => toggleInvoice(inv.id, inv.residual)}
                />
                {inv.number || inv.name} — {inv.residual.toLocaleString('fr-FR')} FCFA restants
              </label>
            ))}
          </div>
        </>
      )}

      <label className="field" style={{ marginBottom: 20 }}>
        <span className="field__label">Mémo</span>
        <input value={communication} onChange={(e) => setCommunication(e.target.value)} placeholder="Référence, note..." />
      </label>

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer le paiement'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}