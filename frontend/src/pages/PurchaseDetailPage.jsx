import { useEffect, useState, useCallback } from 'react';
import {
  getPurchaseDetail,
  sendPurchase,
  confirmPurchase,
  cancelPurchase,
  duplicatePurchase,
  getShareLink,
  deletePurchase,
  updatePurchase,
} from '../api/purchases';
import Dialog from '../components/Dialog';
import PurchaseForm from '../components/PurchaseForm';
import DocumentHeader from '../components/DocumentHeader';
import DocumentFooter from '../components/DocumentFooter';

const STEPS = [
  { key: 'draft', label: 'Demande de prix' },
  { key: 'sent', label: 'Demande de prix envoyée' },
  { key: 'purchase', label: 'Commande fournisseur' },
];

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value || 0) + ' FCFA';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString.replace(' ', 'T')).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PurchaseDetailPage({ purchaseId, onBack, onDeleted, onDuplicated }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getPurchaseDetail(purchaseId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(actionFn, successMessage) {
    setActionLoading(true);
    try {
      await actionFn(purchaseId);
      if (successMessage) alert(successMessage);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSend() {
    await runAction(sendPurchase, "Statut mis à jour : demande marquée comme envoyée.\n(Aucun email réel n'a été envoyé — cette action simule uniquement le changement de statut.)");
  }

  async function handleConfirm() {
    if (!window.confirm('Confirmer cette commande ?')) return;
    await runAction(confirmPurchase);
  }

  async function handleCancel() {
    if (!window.confirm('Annuler cette commande ?')) return;
    await runAction(cancelPurchase);
  }

  async function handleDuplicate() {
    setIsActionMenuOpen(false);
    setActionLoading(true);
    try {
      const result = await duplicatePurchase(purchaseId);
      alert('Commande dupliquée avec succès.');
      onDuplicated?.(result.id);
    } catch (err) {
      alert(`Impossible de dupliquer : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShare() {
    setIsActionMenuOpen(false);
    try {
      const url = await getShareLink(purchaseId);
      await navigator.clipboard.writeText(url);
      alert(`Lien de partage copié dans le presse-papiers :\n${url}`);
    } catch (err) {
      alert(`Impossible de générer le lien de partage : ${err.message}`);
    }
  }

  async function handleDelete() {
    setIsActionMenuOpen(false);
    if (!window.confirm('Supprimer définitivement cette commande ? Cette action est irréversible.')) return;
    try {
      await deletePurchase(purchaseId);
      onDeleted?.();
    } catch (err) {
      alert(`Impossible de supprimer : ${err.message}`);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleEditSubmit(formData) {
    await updatePurchase(purchaseId, formData);
    setIsEditOpen(false);
    await load();
  }

  if (isLoading) return <div className="page"><p className="state-message">Chargement…</p></div>;
  if (error) return <div className="page"><p className="state-message state-message--error">{error}</p></div>;
  if (!detail) return null;

  const { order, lines } = detail;
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.state);
  const isCancelled = order.state === 'cancel';

  return (
  <div className="page">
    <div className="purchase-toolbar">
      <div className="purchase-toolbar__group">
        <button className="btn btn--ghost" onClick={onBack}>← Retour</button>
      </div>
    </div>

    <DocumentHeader />

    <header className="page__header">
      <h1>Demande de prix N°{order.name}</h1>
    </header>

    <div className="purchase-toolbar">
      <div className="purchase-toolbar__group">
        {!isCancelled && (
          <button className="btn btn--soft" onClick={() => setIsEditOpen(true)} disabled={actionLoading}>
            Modifier
          </button>
        )}
        {order.state !== 'purchase' && !isCancelled && (
          <button className="btn btn--soft" onClick={handleSend} disabled={actionLoading}>
            Envoyer par email
          </button>
        )}
        <button className="btn btn--soft" onClick={handlePrint} disabled={actionLoading}>
          Imprimer la demande de prix
        </button>
        {order.state !== 'purchase' && !isCancelled && (
          <button className="btn btn--primary" onClick={handleConfirm} disabled={actionLoading}>
            Confirmer la commande
          </button>
        )}
        {!isCancelled && (
          <button className="btn btn--ghost" onClick={handleCancel} disabled={actionLoading}>
            Annuler
          </button>
        )}
      </div>

      <div className="purchase-toolbar__menu">
        <button className="btn btn--ghost" onClick={() => setIsActionMenuOpen((v) => !v)}>
          Action ▾
        </button>
        {isActionMenuOpen && (
          <div className="dropdown-menu">
            <button onClick={handleDuplicate}>Dupliquer</button>
            <button onClick={handleShare}>Partager</button>
            <button onClick={handleDelete} className="dropdown-menu__danger">Supprimer</button>
          </div>
        )}
      </div>
    </div>

    {!isCancelled ? (
      <div className="status-steps">
        {STEPS.map((step, i) => (
          <div key={step.key} className={`status-steps__step ${i <= currentStepIndex ? 'status-steps__step--active' : ''}`}>
            {step.label}
          </div>
        ))}
      </div>
    ) : (
      <div className="status-steps">
        <div className="status-steps__step status-steps__step--cancelled">Annulée</div>
      </div>
    )}

    <table className="print-doc">
      <tbody>
        <tr>
          <td>
            <section className="panel">
              <div className="purchase-info-grid">
                <div>
                  <p className="field__label">Fournisseur</p>
                  <p>{order.partner_id ? order.partner_id[1] : '—'}</p>
                </div>

                <div>
                  <p className="field__label">Adresse</p>
                  <p>
                    {order.partner_address?.street || '—'}
                    {order.partner_address?.city && `, ${order.partner_address.city}`}
                    {order.partner_address?.country_id && `, ${order.partner_address.country_id[1]}`}
                  </p>
                </div>

                <div>
                  <p className="field__label">Responsable Achats</p>
                  <p>{order.user_id ? order.user_id[1] : '—'}</p>
                </div>

                <div>
                  <p className="field__label">Référence fournisseur</p>
                  <p>{order.partner_ref || '—'}</p>
                </div>
                <div>
                  <p className="field__label">Date de la commande</p>
                  <p>{formatDate(order.date_order)}</p>
                </div>
                <div>
                  <p className="field__label">Société</p>
                  <p>{order.company_id ? order.company_id[1] : '—'}</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <h2 className="panel__title">Articles</h2>
              <div className="table-scroll table-scroll--fit">
                <table className="clients-table clients-table--compact">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Date prévue</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Taxes</th>
                      <th>Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.product_id ? line.product_id[1] : line.name}</td>
                        <td>{formatDate(line.date_planned)}</td>
                        <td>{line.product_qty}</td>
                        <td>{formatPrice(line.price_unit)}</td>
                        <td>{line.tax_names.join(', ') || '—'}</td>
                        <td>{formatPrice(line.price_subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="purchase-totals">
                <div><span>Hors taxe</span><span>{formatPrice(order.amount_untaxed)}</span></div>
                <div><span>Taxes</span><span>{formatPrice(order.amount_tax)}</span></div>
                <div className="purchase-totals__grand"><span>Total</span><span>{formatPrice(order.amount_total)}</span></div>
              </div>
            </section>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <DocumentFooter />
          </td>
        </tr>
      </tfoot>
    </table>

    {isEditOpen && (
      <Dialog title={`Modifier ${order.name}`} onClose={() => setIsEditOpen(false)}>
        <PurchaseForm
          editingOrder={order}
          editingLines={lines}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditOpen(false)}
          isSubmitting={actionLoading}
        />
      </Dialog>
    )}
  </div>
);
}