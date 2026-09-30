import { useEffect, useState, useCallback } from 'react';
import { getUsers, createUser } from '../api/users';
import Dialog from '../components/Dialog';
import UserForm from '../components/UserForm';
import UserDetailPage from './UserDetailPage';
import SearchInput from '../components/SearchInput';

function formatDate(dateString) {
  if (!dateString) return 'Jamais connecté';
  return new Date(dateString.replace(' ', 'T')).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await getUsers(includeArchived));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createUser(formData);
      setIsDialogOpen(false);
      await loadUsers();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (selectedId) {
    return (
      <UserDetailPage
        userId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadUsers();
        }}
      />
    );
  }

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (u.name || '').toLowerCase().includes(term) || (u.login || '').toLowerCase().includes(term);
  });

  return (
    <div>
      <div className="panel__header-row">
        <h2 className="panel__title">Utilisateurs</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)' }}>
            <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
            Afficher les désactivés
          </label>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un utilisateur…" />
          <button className="btn btn--ghost" onClick={loadUsers}>Rafraîchir</button>
          <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
        </div>
      </div>

      {isLoading && <p className="state-message">Chargement…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!isLoading && !error && (
        <div className="table-scroll">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Identifiant</th>
                <th>Langue</th>
                <th>Dernière connexion</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="clients-table__row--clickable" onClick={() => setSelectedId(user.id)}>
                  <td>{user.name}</td>
                  <td>{user.login}</td>
                  <td>{user.lang || '—'}</td>
                  <td>{formatDate(user.login_date)}</td>
                  <td>
                    <span className={`status-badge ${user.active ? 'status-badge--purchase' : 'status-badge--cancel'}`}>
                      {user.active ? 'Actif' : 'Archivé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDialogOpen && (
        <Dialog title="Nouvel utilisateur" onClose={() => setIsDialogOpen(false)}>
          <UserForm onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}