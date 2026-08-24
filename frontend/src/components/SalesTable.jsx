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

export default function SalesTable({ sales, isLoading, error, onDelete, onRowClick }) {
  if (isLoading) return <p className="state-message">Chargement des devis…</p>;
  if (error) return <p className="state-message state-message--error">Impossible de charger les devis : {error}</p>;
  if (sales.length === 0) return <p className="state-message">Aucun devis pour l'instant. Créez-en un avec le bouton ci-dessus.</p>;

  return (
    <div className="table-scroll">
      <table className="clients-table">
        <thead>
          <tr>
            <th>N° de devis</th>
            <th>Date du devis</th>
            <th>Client</th>
            <th>Vendeur</th>
            <th>Total</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((order) => (
            <tr key={order.id} className="clients-table__row--clickable" onClick={() => onRowClick(order)}>
              <td className="clients-table__ref">{order.name}</td>
              <td>{formatDate(order.date_order)}</td>
              <td>{order.partner_id ? order.partner_id[1] : '—'}</td>
              <td>{order.user_id ? order.user_id[1] : '—'}</td>
              <td>{formatPrice(order.amount_total)}</td>
              <td>
                <span className={`status-badge status-badge--${order.state}`}>{order.state_label}</span>
              </td>
              <td className="clients-table__actions">
                <button
                  className="icon-btn icon-btn--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(order);
                  }}
                  aria-label={`Supprimer ${order.name}`}
                  title="Supprimer"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
                    <path
                      d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}