import { useEffect, useState, useCallback } from 'react';
import { getInvoices, createInvoice, deleteInvoice } from '../api/invoices';
import Dialog from '../components/Dialog';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceDetailPage from './InvoiceDetailPage';
import SearchInput from '../components/SearchInput';

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value || 0) + ' FCFA';
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

const TITLES = {
  out_invoice: { title: 'Factures clients', createLabel: 'Nouvelle facture' },
  out_refund: { title: 'Avoirs clients', createLabel: 'Nouvel avoir' },
  in_invoice: { title: 'Factures fournisseurs', createLabel: 'Nouvelle facture' },
  in_refund: { title: 'Avoirs fournisseurs', createLabel: 'Nouvel avoir' },
};

export default function InvoiceListPage({ type }) {
  const [invoices, setInvoices] = useState([]);
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
      setInvoices(await getInvoices(type));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createInvoice(formData);
      setIsDialogOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(inv) {
    if (!window.confirm(`Supprimer "${inv.number || inv.name}" ?`)) return;
    try {
      await deleteInvoice(inv.id);
      await load();
    } catch (err) {
      alert(`Impossible de supprimer : ${err.message}`);
    }
  }

  if (selectedId) {
    return <InvoiceDetailPage invoiceId={selectedId} type={type} onBack={() => { setSelectedId(null); load(); }} />;
  }

  const filtered = invoices.filter((i) => ((i.number || i.name || '') + (i.partner_id ? i.partner_id[1] : '')).toLowerCase().includes(searchTerm.toLowerCase()));
  const { title, createLabel } = TITLES[type];

  return (
    <div>
      <div className="panel__header-row">
        <h2 className="panel__title">{title}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher…" />
          <button className="btn btn--ghost" onClick={load}>Rafraîchir</button>
          <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ {createLabel}</button>
        </div>
      </div>

      {isLoading && <p className="state-message">Chargement…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!isLoading && !error && (
        <div className="table-scroll">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Partenaire</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Total</th>
                <th>Reste dû</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="clients-table__row--clickable" onClick={() => setSelectedId(inv.id)}>
                  <td className="clients-table__ref">{inv.number || inv.name || 'Brouillon'}</td>
                  <td>{inv.partner_id ? inv.partner_id[1] : '—'}</td>
                  <td>{formatDate(inv.date_invoice)}</td>
                  <td>{formatDate(inv.date_due)}</td>
                  <td>{formatPrice(inv.amount_total)}</td>
                  <td>{formatPrice(inv.residual)}</td>
                  <td><span className={`status-badge status-badge--${inv.state}`}>{inv.state_label}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7"><p className="state-message">Aucun résultat.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isDialogOpen && (
        <Dialog title={createLabel} onClose={() => setIsDialogOpen(false)}>
          <InvoiceForm type={type} onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}