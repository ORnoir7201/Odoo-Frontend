import Dialog from './Dialog';
import DocumentHeader from './DocumentHeader';
import DocumentFooter from './DocumentFooter';

function formatPrice(v) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(v || 0) + ' FCFA';
}

export default function PrintPreview({ title, infoItems, lineItems, totals, receiptRows, mode = 'lines', onClose }) {
  function handlePrint() {
    window.print();
  }

  const showDiscountColumn = mode === 'lines' && lineItems.some((l) => l.discount !== undefined);

  return (
    <Dialog title="Aperçu avant impression" onClose={onClose}>
      <div className="print-preview">
        <div className="print-preview__toolbar">
          <button className="btn btn--primary" onClick={handlePrint}>🖨 Imprimer</button>
        </div>

        <div className="printable-area">
          <table className="print-doc">
            <tbody>
              <tr>
                <td>
                  <DocumentHeader />

                  <h1 className="print-doc__title">{title}</h1>

                  <div className="print-doc__meta">
                    {infoItems.map((item) => (
                      <div key={item.label}>
                        <p className="print-doc__meta-label">{item.label}</p>
                        <p className="print-doc__meta-value">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {mode === 'lines' && (
                    <>
                      <table className="print-doc__table">
                        <thead>
                          <tr>
                            <th>Article</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            {showDiscountColumn && <th>Remise (%)</th>}
                            <th>Taxes</th>
                            <th>Sous-total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((l, i) => (
                            <tr key={i}>
                              <td>{l.article}</td>
                              <td>{l.quantity}</td>
                              <td>{formatPrice(l.priceUnit)}</td>
                              {showDiscountColumn && <td>{l.discount || 0}%</td>}
                              <td>{l.taxNames || '—'}</td>
                              <td>{formatPrice(l.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {totals && (
                        <div className="print-doc__totals">
                          <div><span>Hors taxe</span><span>{formatPrice(totals.untaxed)}</span></div>
                          <div><span>Taxes</span><span>{formatPrice(totals.tax)}</span></div>
                          <div className="print-doc__totals-grand"><span>Total</span><span>{formatPrice(totals.total)}</span></div>
                        </div>
                      )}
                    </>
                  )}

                  {mode === 'receipt' && (
                    <table className="print-doc__table">
                      <thead>
                        <tr>
                          <th>Date de facture</th>
                          <th>Numéro de facture</th>
                          <th>Montant initial</th>
                          <th>Montant payé</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptRows.map((r, i) => (
                          <tr key={i}>
                            <td>{r.date}</td>
                            <td>{r.number}</td>
                            <td>{formatPrice(r.initial)}</td>
                            <td>{formatPrice(r.paid)}</td>
                            <td>{formatPrice(r.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td><DocumentFooter /></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Dialog>
  );
}