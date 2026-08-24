export default function Dialog({ title, onClose, children }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-panel__header">
          <h2 className="dialog-panel__title">{title}</h2>
          <button className="dialog-panel__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}