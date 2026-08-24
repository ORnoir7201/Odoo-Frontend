/**
 * Boutons d'action (Modifier / Supprimer) sous forme d'icônes, réutilisés
 * dans tous les tableaux (Contacts, Produits, Fournisseurs...). Centraliser
 * ça ici évite de dupliquer le SVG dans chaque tableau.
 */
export default function ActionButtons({ onEdit, onDelete, label }) {
  return (
    <div className="action-buttons">
      <button
        className="icon-btn"
        onClick={onEdit}
        aria-label={`Modifier ${label}`}
        title="Modifier"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        className="icon-btn icon-btn--danger"
        onClick={onDelete}
        aria-label={`Supprimer ${label}`}
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
    </div>
  );
}