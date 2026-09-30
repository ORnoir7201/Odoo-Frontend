import { useEffect, useState, useCallback } from 'react';
import {
  getInvoiceDetail, updateInvoice, deleteInvoice, confirmInvoice,
  cancelInvoice, duplicateInvoice, getShareLink,
  sendInvoice, resetInvoiceToDraft, addRefund, getInvoiceMessages, postInvoiceMessage,
} from '../api/invoices';
import { createPayment, confirmPayment } from '../api/payments';
import Dialog from '../components/Dialog';
import InvoiceForm from '../components/InvoiceForm';
import PaymentForm from '../components/PaymentForm';
import Chatter from '../components/Chatter';
import useClickOutside from '../hooks/useClickOutside';
import PrintPreview from '../components/PrintPreview';

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value || 0) + ' FCFA';
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

export default function InvoiceDetailPage({ invoiceId, type, onBack }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setIsActionMenuOpen(false));
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getInvoiceDetail(invoiceId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => { load(); }, [load]);

  async function handleConfirm() {
    if (!window.confirm('Valider cette facture ?')) return;
    setActionLoading(true);
    try {
      await confirmInvoice(invoiceId);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Annuler cette facture ?')) return;
    setActionLoading(true);
    try {
      await cancelInvoice(invoiceId);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetDraft() {
    if (!window.confirm('Remettre cette facture au brouillon ?')) return;
    setActionLoading(true);
    try {
      await resetInvoiceToDraft(invoiceId);
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendAndPrint() {
  setActionLoading(true);
  try {
    await sendInvoice(invoiceId);
    await load();
    setIsPrintOpen(true);
  } catch (err) {
    alert(`Action impossible : ${err.message}`);
  } finally {
    setActionLoading(false);
  }
}

  async function handleAddRefund() {
    setIsActionMenuOpen(false);
    if (!window.confirm('Créer un avoir pour cette facture ?')) return;
    try {
      await addRefund(invoiceId);
      alert('Avoir créé avec succès (dans les Avoirs correspondants).');
    } catch (err) {
      alert(`Impossible de créer l'avoir : ${err.message}`);
    }
  }

  async function handleDuplicate() {
    setIsActionMenuOpen(false);
    try {
      await duplicateInvoice(invoiceId);
      alert('Facture dupliquée.');
    } catch (err) {
      alert(`Impossible de dupliquer : ${err.message}`);
    }
  }

  async function handleShare() {
    setIsActionMenuOpen(false);
    try {
      const url = await getShareLink(invoiceId);
      await navigator.clipboard.writeText(url);
      alert(`Lien copié :\n${url}`);
    } catch (err) {
      alert(`Impossible : ${err.message}`);
    }
  }

  async function handleDelete() {
    setIsActionMenuOpen(false);
    if (!window.confirm('Supprimer définitivement cette facture ?')) return;
    try {
      await deleteInvoice(invoiceId);
      onBack();
    } catch (err) {
      alert(`Impossible de supprimer : ${err.message}`);
    }
  }

  async function handleEditSubmit(formData) {
    setActionLoading(true);
    try {
      await updateInvoice(invoiceId, formData);
      setIsEditOpen(false);
      await load();
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaymentSubmit(formData) {
    setIsSubmittingPayment(true);
    try {
      const result = await createPayment(formData);
      try {
        await confirmPayment(result.id);
      } catch (confirmErr) {
        alert(`Paiement enregistré en brouillon, mais la validation automatique a échoué : ${confirmErr.message}\nValide-le manuellement depuis l'onglet Paiements.`);
      }
      setIsPaymentOpen(false);
      await load();
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  function handlePrint() {
    setIsPrintOpen(true);
  }

  if (isLoading) return <div className="page"><p className="state-message">Chargement…</p></div>;
  if (error) return <div className="page"><p className="state-message state-message--error">{error}</p></div>;
  if (!detail) return null;

  const { invoice, lines } = detail;
  const isDraft = invoice.state === 'draft';
  const isOpen = invoice.state === 'open';
  const isCancelled = invoice.state === 'cancel';
  const isCustomerType = type.startsWith('out_');
  const partnerType = isCustomerType ? 'customer' : 'supplier';

  return (
    <div className="page">
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">
          <button className="btn btn--ghost" onClick={onBack}>←Retour</button>
          {isDraft && <button className="btn btn--soft" onClick={() => setIsEditOpen(true)}>Modifier</button>}
          {isDraft && <button className="btn btn--soft" onClick={handleSendAndPrint} disabled={actionLoading}>Envoyer &amp; Imprimer</button>}
          {!isDraft && <button className="btn btn--soft" onClick={handlePrint}>Prévisualiser</button>}
          {isOpen && <button className="btn btn--soft" onClick={() => setIsPaymentOpen(true)}>Enregistrer un paiement</button>}
          {isDraft && <button className="btn btn--primary" onClick={handleConfirm} disabled={actionLoading}>Valider</button>}
          {isOpen && <button className="btn btn--ghost" onClick={handleResetDraft} disabled={actionLoading}>Remettre au Brouillon</button>}
          {!isCancelled && <button className="btn btn--ghost" onClick={handleCancel} disabled={actionLoading}>Annuler</button>}
        </div>
        <div className="purchase-toolbar__menu" ref={menuRef}>
          <button className="btn btn--ghost" onClick={() => setIsActionMenuOpen((v) => !v)}>Action ▾</button>
          {isActionMenuOpen && (
            <div className="dropdown-menu">
              {isOpen && <button onClick={handleAddRefund}>Ajouter un avoir</button>}
              <button onClick={handleDuplicate}>Dupliquer</button>
              <button onClick={handleShare}>Partager</button>
              <button onClick={handleDelete} className="dropdown-menu__danger">Supprimer</button>
            </div>
          )}
        </div>
      </div>

      <header className="page__header">
        <h1>{invoice.number || invoice.name || 'Brouillon'}</h1>
        <span className={`status-badge status-badge--${invoice.state}`}>{invoice.state_label}</span>
      </header>

              <section className="panel">
                <div className="purchase-info-grid">
                  <div>
                    <p className="field__label">{isCustomerType ? 'Client' : 'Fournisseur'}</p>
                    <p>{invoice.partner_id ? invoice.partner_id[1] : '—'}</p>
                  </div>
                  <div>
                    <p className="field__label">Adresse</p>
                    <p>{formatAddress(invoice.partner_address)}</p>
                  </div>
                  <div>
                    <p className="field__label">Conditions de paiement</p>
                    <p>{invoice.payment_term_id ? invoice.payment_term_id[1] : '—'}</p>
                  </div>
                  <div>
                    <p className="field__label">Date de facturation</p>
                    <p>{formatDate(invoice.date_invoice)}</p>
                  </div>
                  <div>
                    <p className="field__label">Date d'échéance</p>
                    <p>{formatDate(invoice.date_due)}</p>
                  </div>
                  <div>
                    <p className="field__label">Vendeur</p>
                    <p>{invoice.user_id ? invoice.user_id[1] : '—'}</p>
                  </div>
                  <div>
                    <p className="field__label">Équipe commerciale</p>
                    <p>{invoice.team_id ? invoice.team_id[1] : '—'}</p>
                  </div>
                </div>
              </section>

              <section className="panel">
                <h2 className="panel__title">Articles</h2>
                <div className="table-scroll table-scroll--fit">
                  <table className="clients-table clients-table--compact">
                    <thead>
                      <tr>
                        <th>Article</th><th>Quantité</th><th>Prix unitaire</th><th>Remise (%)</th><th>Taxes</th><th>Sous-total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.id}>
                          <td>{line.product_id ? line.product_id[1] : line.name}</td>
                          <td>{line.quantity}</td>
                          <td>{formatPrice(line.price_unit)}</td>
                          <td>{line.discount || 0}%</td>
                          <td>{line.tax_names.join(', ') || '—'}</td>
                          <td>{formatPrice(line.price_subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="purchase-totals">
                  <div><span>Hors taxe</span><span>{formatPrice(invoice.amount_untaxed)}</span></div>
                  <div><span>Taxes</span><span>{formatPrice(invoice.amount_tax)}</span></div>
                  <div className="purchase-totals__grand"><span>Total</span><span>{formatPrice(invoice.amount_total)}</span></div>
                  <div><span>Reste dû</span><span>{formatPrice(invoice.residual)}</span></div>
                </div>
              </section>

              <section className="panel">
                <Chatter getMessages={getInvoiceMessages} postMessage={postInvoiceMessage} itemId={invoiceId} />
              </section>

      {isEditOpen && (
        <Dialog title="Modifier la facture" onClose={() => setIsEditOpen(false)}>
          <InvoiceForm
            type={type}
            editingInvoice={invoice}
            editingLines={lines}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={actionLoading}
          />
        </Dialog>
      )}

      {isPaymentOpen && (
        <Dialog title="Enregistrer un paiement" onClose={() => setIsPaymentOpen(false)}>
          <PaymentForm
            partnerType={partnerType}
            initialPartnerId={invoice.partner_id ? invoice.partner_id[0] : null}
            initialInvoiceId={invoiceId}
            onSubmit={handlePaymentSubmit}
            onCancel={() => setIsPaymentOpen(false)}
            isSubmitting={isSubmittingPayment}
          />
        </Dialog>
      )}

      {isPrintOpen && (
        <PrintPreview
          title={`${type.endsWith('_refund') ? 'Avoir' : 'Facture'} ${invoice.number || invoice.name || ''}`}
          infoItems={[
            { label: type.startsWith('out_') ? 'Client' : 'Fournisseur', value: invoice.partner_id ? invoice.partner_id[1] : '—' },
            { label: 'Addresse', value: formatAddress(invoice.partner_address) },
            { label: 'Conditions de paiement', value: invoice.payment_term_id ? invoice.payment_term_id[1] : '—' },
            { label: 'Date de facturation', value: formatDate(invoice.date_invoice) },
            { label: "Date d'échéance", value: formatDate(invoice.date_due) },
            { label: 'Vendeur', value: invoice.user_id ? invoice.user_id[1] : '—' },
            { label: 'Équipe commerciale', value: invoice.team_id ? invoice.team_id[1] : '—' },
          ]}
          lineItems={lines.map((l) => ({
            article: l.product_id ? l.product_id[1] : l.name,
            quantity: l.quantity,
            priceUnit: l.price_unit,
            discount: l.discount,
            taxNames: l.tax_names.join(', '),
            subtotal: l.price_subtotal,
          }))}
          totals={{ untaxed: invoice.amount_untaxed, tax: invoice.amount_tax, total: invoice.amount_total }}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}