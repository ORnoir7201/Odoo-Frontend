function formatPrice(price) {
  if (price == null) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(price) + ' FCFA';
}

export default function ProductsTable({ products, isLoading, error, onRowClick, onDelete }) {
  if (isLoading) return <p className="state-message">Chargement des produits…</p>;
  if (error) return <p className="state-message state-message--error">Impossible de charger les produits : {error}</p>;
  if (products.length === 0) {
    return <p className="state-message">Aucun produit enregistré pour l'instant. Cliquez sur "+ Créer" pour ajouter le premier.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="clients-table">
        <thead>
          <tr>
            <th>Fiche</th>
            <th>Référence</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Catégorie</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="clients-table__row--clickable" onClick={() => onRowClick(product)}>
              <td className="clients-table__ref">REC-{String(product.id).padStart(4, '0')}</td>
              <td>{product.default_code || '—'}</td>
              <td>{product.name || '—'}</td>
              <td>{product.type_label}</td>
              <td>{formatPrice(product.list_price)}</td>
              <td>{product.qty_available ?? '—'}</td>
              <td>{product.categ_id ? product.categ_id[1] : '—'}</td>
              <td className="clients-table__actions">
                <button
                  className="icon-btn icon-btn--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(product);
                  }}
                  aria-label={`Supprimer ${product.name}`}
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