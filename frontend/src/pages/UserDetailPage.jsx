import { useEffect, useState, useCallback } from 'react';
import { getUserDetail, updateUser, archiveUser, unarchiveUser } from '../api/users';
import { getCompanies } from '../api/companies';
import Dialog from '../components/Dialog';
import UserForm from '../components/UserForm';

export default function UserDetailPage({ userId, onBack }) {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUser(await getUserDetail(userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    getCompanies().then(setCompanies).catch((err) => console.error('Sociétés:', err.message));
  }, [load]);

  async function handleEditSubmit(formData) {
    setIsSubmitting(true);
    try {
      await updateUser(userId, formData);
      setIsEditOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive() {
    const action = user.active ? 'archiver' : 'réactiver';
    if (!window.confirm(`Voulez-vous vraiment ${action} "${user.name}" ?`)) return;
    try {
      if (user.active) {
        await archiveUser(userId);
      } else {
        await unarchiveUser(userId);
      }
      await load();
    } catch (err) {
      alert(`Action impossible : ${err.message}`);
    }
  }

  if (isLoading) return <p className="state-message">Chargement…</p>;
  if (error) return <p className="state-message state-message--error">{error}</p>;
  if (!user) return null;

  const authorizedCompanyNames = companies
    .filter((c) => (user.company_ids || []).includes(c.id))
    .map((c) => c.name);

  return (
    <div>
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">
          <button className="btn btn--ghost" onClick={onBack}>← Retour</button>
          <button className="btn btn--soft" onClick={() => setIsEditOpen(true)}>Modifier</button>
          <button className="btn btn--ghost" onClick={handleToggleActive}>
            {user.active ? 'Archiver' : 'Réactiver'}
          </button>
        </div>
      </div>

      <div className="client-detail__identity" style={{ marginBottom: 24 }}>
        <div className="logo-uploader__preview logo-uploader__preview--round logo-uploader__preview--lg">
          {user.image ? <img src={`data:image/png;base64,${user.image}`} alt={user.name} /> : <span>Aucune photo</span>}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)' }}>{user.login}</p>
        </div>
        <span className={`status-badge ${user.active ? 'status-badge--purchase' : 'status-badge--cancel'}`} style={{ marginLeft: 'auto' }}>
          {user.active ? 'Actif' : 'Archivé'}
        </span>
      </div>

      <section className="panel">
        <h3 className="panel__title">Multi Sociétés</h3>
        <div className="purchase-info-grid">
          <div>
            <p className="field__label">Sociétés autorisées</p>
            <p>
              {authorizedCompanyNames.length > 0
                ? authorizedCompanyNames.map((name) => (
                    <span key={name} className="status-badge" style={{ marginRight: 6 }}>{name}</span>
                  ))
                : '—'}
            </p>
          </div>
          <div>
            <p className="field__label">Société Courante</p>
            <p>{user.company_id ? user.company_id[1] : '—'}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel__title">Accès des applications</h3>
        <div className="purchase-info-grid">
          {user.appAccess
            .filter((f) => f.value)
            .map((f) => {
              const option = f.options.find((o) => o.value === f.value);
              return (
                <div key={f.field}>
                  <p className="field__label">{f.label}</p>
                  <p>{option ? option.label : f.value}</p>
                </div>
              );
            })}
          {user.appAccess.filter((f) => f.value).length === 0 && (
            <p className="state-message">Aucun accès particulier configuré.</p>
          )}
        </div>
      </section>

      {isEditOpen && (
        <Dialog title={`Modifier « ${user.name} »`} onClose={() => setIsEditOpen(false)}>
          <UserForm
            editingUser={user}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      )}
    </div>
  );
}