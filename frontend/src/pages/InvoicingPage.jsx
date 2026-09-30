import { useState } from 'react';
import InvoiceOverviewPage from './InvoiceOverviewPage';
import InvoiceListPage from './InvoiceListPage';
import PaymentListPage from './PaymentListPage';

export default function InvoicingPage() {
  const [mainTab, setMainTab] = useState('overview'); // overview | clients | suppliers
  const [subTab, setSubTab] = useState('invoices'); // invoices | refunds | payments

  const typeMap = {
    clients: { invoices: 'out_invoice', refunds: 'out_refund' },
    suppliers: { invoices: 'in_invoice', refunds: 'in_refund' },
  };

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Comptabilité</p>
        <h1>Facturation</h1>
      </header>

      <div className="config-subtabs">
        <button className={`config-subtabs__tab ${mainTab === 'overview' ? 'config-subtabs__tab--active' : ''}`} onClick={() => setMainTab('overview')}>Vue d'ensemble</button>
        <button className={`config-subtabs__tab ${mainTab === 'clients' ? 'config-subtabs__tab--active' : ''}`} onClick={() => { setMainTab('clients'); setSubTab('invoices'); }}>Clients</button>
        <button className={`config-subtabs__tab ${mainTab === 'suppliers' ? 'config-subtabs__tab--active' : ''}`} onClick={() => { setMainTab('suppliers'); setSubTab('invoices'); }}>Fournisseurs</button>
      </div>

      {mainTab === 'overview' && <InvoiceOverviewPage />}

      {(mainTab === 'clients' || mainTab === 'suppliers') && (
        <>
          <div className="config-subtabs config-subtabs--secondary">
            <button className={`config-subtabs__tab ${subTab === 'invoices' ? 'config-subtabs__tab--active' : ''}`} onClick={() => setSubTab('invoices')}>Factures</button>
            <button className={`config-subtabs__tab ${subTab === 'refunds' ? 'config-subtabs__tab--active' : ''}`} onClick={() => setSubTab('refunds')}>Avoirs</button>
            <button className={`config-subtabs__tab ${subTab === 'payments' ? 'config-subtabs__tab--active' : ''}`} onClick={() => setSubTab('payments')}>Paiements</button>
          </div>

          <section className="panel">
            {subTab === 'payments' ? (
              <PaymentListPage partnerType={mainTab === 'clients' ? 'customer' : 'supplier'} />
            ) : (
              <InvoiceListPage type={typeMap[mainTab][subTab]} />
            )}
          </section>
        </>
      )}
    </div>
  );
}