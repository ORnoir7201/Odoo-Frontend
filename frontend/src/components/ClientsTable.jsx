function formatAddress(client) {
  const parts = [];
  if (client.street) parts.push(client.street);
  const cityLine = [client.zip, client.city].filter(Boolean).join(' ');
  if (cityLine) parts.push(cityLine);
  if (client.country_id) parts.push(client.country_id[1]);
  return parts.length > 0 ? parts.join(', ') : '—';
}

export default function ClientsTable({ clients, isLoading, error, onRowClick, onDelete }) {
  if (isLoading) return <p className="state-message">Chargement des contacts…</p>;
  if (error) return <p className="state-message state-message--error">Impossible de charger les contacts : {error}</p>;
  if (clients.length === 0) {
    return <p className="state-message">Aucun contact enregistré pour l'instant. Cliquez sur "+ Créer" pour ajouter le premier.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="clients-table">
        <thead>
          <tr>
            <th>Fiche</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Adresse</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="clients-table__row--clickable" onClick={() => onRowClick(client)}>
              <td className="clients-table__ref">REC-{String(client.id).padStart(4, '0')}</td>
              <td>{client.name || '—'}</td>
              <td>{client.email || '—'}</td>
              <td>{client.phone || '—'}</td>
              <td>{formatAddress(client)}</td>
              <td className="clients-table__actions">
                <button
                  className="icon-btn icon-btn--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(client);
                  }}
                  aria-label={`Supprimer ${client.name}`}
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