import { useEffect, useState, useCallback } from 'react';
import { getPayments, createPayment } from '../api/payments';
import Dialog from '../components/Dialog';
import PaymentForm from '../components/PaymentForm';
import PaymentDetailPage from './PaymentDetailPage';
import SearchInput from '../components/SearchInput';

function formatPrice(v) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(v || 0) + ' FCFA';
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function PaymentListPage({ partnerType }) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPayments(await getPayments(partnerType));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [partnerType]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createPayment(formData);
      setIsDialogOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (selectedId) {
    return <PaymentDetailPage paymentId={selectedId} onBack={() => { setSelectedId(null); load(); }} />;
  }

  const filtered = payments.filter((p) => ((p.name || '') + (p.partner_id ? p.partner_id[1] : '')).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="panel__header-row">
        <h2 className="panel__title">{partnerType === 'customer' ? 'Paiements clients' : 'Paiements fournisseurs'}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher…" />
          <button className="btn btn--ghost" onClick={load}>Rafraîchir</button>
          <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
        </div>
      </div>

      {isLoading && <p className="state-message">Chargement…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!isLoading && !error && (
        <div className="table-scroll">
          <table className="clients-table">
            <thead>
              <tr><th>Référence</th><th>Partenaire</th><th>Date</th><th>Montant</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="clients-table__row--clickable" onClick={() => setSelectedId(p.id)}>
                  <td className="clients-table__ref">{p.name || 'Brouillon'}</td>
                  <td>{p.partner_id ? p.partner_id[1] : '—'}</td>
                  <td>{formatDate(p.payment_date)}</td>
                  <td>{formatPrice(p.amount)}</td>
                  <td><span className={`status-badge status-badge--${p.state}`}>{p.state_label}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5"><p className="state-message">Aucun paiement.</p></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {isDialogOpen && (
        <Dialog title="Nouveau paiement" onClose={() => setIsDialogOpen(false)}>
          <PaymentForm partnerType={partnerType} onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}