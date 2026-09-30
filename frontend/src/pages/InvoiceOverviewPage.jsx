import { useEffect, useState } from 'react';
import { getOverview } from '../api/invoices';

function formatPrice(v) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(v || 0) + ' FCFA';
}

export default function InvoiceOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOverview().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="state-message state-message--error">{error}</p>;
  if (!data) return <p className="state-message">Chargement…</p>;

  return (
    <div className="invoice-overview-grid">
      <div className="invoice-overview-card">
        <h3>Factures clients</h3>
        <div className="invoice-overview-card__row">
          <span>{data.customerInvoices.toValidate.count} Factures à valider</span>
          <strong>{formatPrice(data.customerInvoices.toValidate.total)}</strong>
        </div>
        <div className="invoice-overview-card__row">
          <span>{data.customerInvoices.unpaid.count} Factures impayées</span>
          <strong>{formatPrice(data.customerInvoices.unpaid.total)}</strong>
        </div>
      </div>
      <div className="invoice-overview-card">
        <h3>Factures fournisseurs</h3>
        <div className="invoice-overview-card__row">
          <span>{data.supplierBills.toValidate.count} Factures à valider</span>
          <strong>{formatPrice(data.supplierBills.toValidate.total)}</strong>
        </div>
        <div className="invoice-overview-card__row">
          <span>{data.supplierBills.unpaid.count} Factures à payer</span>
          <strong>{formatPrice(data.supplierBills.unpaid.total)}</strong>
        </div>
      </div>
    </div>
  );
}