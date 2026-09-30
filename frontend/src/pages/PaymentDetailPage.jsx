import { useEffect, useState, useCallback } from 'react';
import {
  getPaymentDetail, confirmPayment, cancelPayment, deletePayment,
  updatePayment, sendReceipt, resetPaymentToDraft, getPaymentMessages, postPaymentMessage,
} from '../api/payments';
import Dialog from '../components/Dialog';
import Chatter from '../components/Chatter';
import useClickOutside from '../hooks/useClickOutside';
import PrintPreview from '../components/PrintPreview';

function formatPrice(v) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(v || 0) + ' FCFA';
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function formatAddress(partner) {
  if (!partner) return '—';
  const parts = [];
  if (partner.street) parts.push(partner.street);
  if (partner.street2) parts.push(partner.street2);
  const cityLine = [partner.zip, partner.city].filter(Boolean).join(' ');
  if (cityLine) parts.push(cityLine);
  if (partner.country_id) parts.push(partner.country_id[1]);
  return parts.length > 0 ? parts.join(', ') : '—';
}

export default function PaymentDetailPage({ paymentId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setIsActionMenuOpen(false));
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getPaymentDetail(paymentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => { load(); }, [load]);

  function openEdit() {
    setEditAmount(String(detail.payment.amount));
    setEditDate(detail.payment.payment_date);
    setEditMemo(detail.payment.communication || '');
    setIsEditOpen(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updatePayment(paymentId, { amount: editAmount, paymentDate: editDate, communication: editMemo });
      setIsEditOpen(false);
      await load();
    } catch (err) {
      alert(`Impossible de modifier : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm() {
    if (!window.confirm('Confirmer ce paiement ? Il sera rapproché des factures liées.')) return;
    setActionLoading(true);
    try {
      await confirmPayment(paymentId);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Annuler ce paiement ?')) return;
    setActionLoading(true);
    try {
      await cancelPayment(paymentId);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetDraft() {
    if (!window.confirm('Remettre ce paiement au brouillon ?')) return;
    setActionLoading(true);
    try {
      await resetPaymentToDraft(paymentId);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendReceipt() {
    setActionLoading(true);
    try {
      await sendReceipt(paymentId);
      await load();
      alert('Reçu enregistré comme envoyé (simulation — visible dans le fil ci-dessous).');
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDuplicate() {
    setIsActionMenuOpen(false);
    alert("La duplication n'est pas encore disponible pour les paiements.");
  }

  async function handleDelete() {
    setIsActionMenuOpen(false);
    if (!window.confirm('Supprimer définitivement ce paiement ?')) return;
    try {
      await deletePayment(paymentId);
      onBack();
    } catch (err) {
      alert(`Impossible de supprimer : ${err.message}`);
    }
  }

  if (isLoading) return <p className="state-message">Chargement…</p>;
  if (error) return <p className="state-message state-message--error">{error}</p>;
  if (!detail) return null;

  const { payment, invoices } = detail;
  const isDraft = payment.state === 'draft';

  return (
    <div>
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">
          <button className="btn btn--ghost" onClick={onBack}>← Retour</button>
          <button className="btn btn--soft" onClick={() => setIsPrintOpen(true)}>Imprimer le reçu</button>
          {isDraft && <button className="btn btn--soft" onClick={openEdit}>Modifier</button>}
          {!isDraft && <button className="btn btn--soft" onClick={handleSendReceipt} disabled={actionLoading}>Envoyer le Reçu par Courriel</button>}
          {isDraft && <button className="btn btn--primary" onClick={handleConfirm} disabled={actionLoading}>Confirmer les paiements</button>}
          {!isDraft && <button className="btn btn--ghost" onClick={handleResetDraft} disabled={actionLoading}>Remettre au Brouillon</button>}
          {!isDraft && <button className="btn btn--ghost" onClick={handleCancel} disabled={actionLoading}>Annuler</button>}
        </div>
        <div className="purchase-toolbar__menu" ref={menuRef}>
          <button className="btn btn--ghost" onClick={() => setIsActionMenuOpen((v) => !v)}>Action ▾</button>
          {isActionMenuOpen && (
            <div className="dropdown-menu">
              <button onClick={handleDuplicate}>Dupliquer</button>
              {isDraft && <button onClick={handleDelete} className="dropdown-menu__danger">Supprimer</button>}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>{payment.name || 'Paiement'}</h2>
        <span className={`status-badge status-badge--${payment.state}`}>{payment.state_label}</span>
      </div>

      <section className="panel">
        <div className="purchase-info-grid">
          <div>
            <p className="field__label">Type de paiement</p>
            <p>{payment.payment_type_label}</p>
          </div>
          <div>
            <p className="field__label">Type de partenaire</p>
            <p>{payment.partner_type === 'customer' ? 'Client' : 'Fournisseur'}</p>
          </div>
          <div>
            <p className="field__label">Partenaire</p>
            <p>{payment.partner_id ? payment.partner_id[1] : '—'}</p>
          </div>
          <div>
            <p className="field__label">Adresse</p>
            <p>{formatAddress(payment.partner_address)}</p>
          </div>
          <div>
            <p className="field__label">Montant du paiement</p>
            <p>{formatPrice(payment.amount)}</p>
          </div>
          <div>
            <p className="field__label">Journal des Paiements</p>
            <p>{payment.journal_id ? payment.journal_id[1] : '—'}</p>
          </div>
          <div>
            <p className="field__label">Date de règlement</p>
            <p>{formatDate(payment.payment_date)}</p>
          </div>
          <div>
            <p className="field__label">Mémo</p>
            <p>{payment.communication || '—'}</p>
          </div>
        </div>
      </section>

      {invoices.length > 0 && (
        <section className="panel">
          <h3 className="panel__title">Factures liées</h3>
          <div className="table-scroll">
            <table className="clients-table">
              <thead>
                <tr><th>Référence</th><th>Total</th><th>Reste dû</th></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.number || inv.name}>
                    <td className="clients-table__ref">{inv.number || inv.name}</td>
                    <td>{formatPrice(inv.amount_total)}</td>
                    <td>{formatPrice(inv.residual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <Chatter getMessages={getPaymentMessages} postMessage={postPaymentMessage} itemId={paymentId} />
      </section>

      {isEditOpen && (
        <Dialog title="Modifier le paiement" onClose={() => setIsEditOpen(false)}>
          <form onSubmit={handleEditSubmit}>
            <div className="client-form__grid">
              <label className="field">
                <span className="field__label">Montant</span>
                <input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              </label>
              <label className="field">
                <span className="field__label">Date</span>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </label>
              <label className="field field--wide">
                <span className="field__label">Mémo</span>
                <input value={editMemo} onChange={(e) => setEditMemo(e.target.value)} />
              </label>
            </div>
            <div className="client-form__actions">
              <button type="submit" className="btn btn--primary" disabled={actionLoading}>
                {actionLoading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setIsEditOpen(false)}>Annuler</button>
            </div>
          </form>
        </Dialog>
      )}
      {isPrintOpen && (
        <PrintPreview
          title={`Reçu de paiement : ${payment.name || ''}`}
          infoItems={[
            { label: payment.partner_type === 'customer' ? 'Client' : 'Fournisseur', value: payment.partner_id ? payment.partner_id[1] : '—' },
            { label: 'Adresse', value: formatAddress(payment.partner_address) },
            { label: 'Date de règlement', value: formatDate(payment.payment_date) },
            { label: 'Méthode de règlement', value: payment.payment_type_label },
            { label: 'Mémo', value: payment.communication || '—' },
            { label: 'Montant du règlement', value: formatPrice(payment.amount) },
          ]}
          mode="receipt"
          receiptRows={invoices.map((inv) => ({
            date: formatDate(inv.date_invoice),
            number: inv.number || inv.name,
            initial: inv.amount_total,
            paid: inv.amount_total - inv.residual,
            balance: inv.residual,
          }))}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}