export default function StatCard({ label, value, hint, icon, onClick }) {
  return (
    <div
      className={`stat-card ${onClick ? 'stat-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && <div className="stat-card__icon">{icon}</div>}
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {hint && <p className="stat-card__hint">{hint}</p>}
    </div>
  );
}