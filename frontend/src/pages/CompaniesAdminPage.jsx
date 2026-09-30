import { useEffect, useState, useCallback } from 'react';
import { getCompaniesAdmin, createCompanyAdmin } from '../api/companiesAdmin';
import Dialog from '../components/Dialog';
import CompanyForm from '../components/CompanyForm';
import CompanyDetailPage from './CompanyDetailPage';
import SearchInput from '../components/SearchInput';

export default function CompaniesAdminPage() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompanies(await getCompaniesAdmin());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createCompanyAdmin(formData);
      setIsDialogOpen(false);
      await loadCompanies();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (selectedId) {
    return (
      <CompanyDetailPage
        companyId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadCompanies();
        }}
      />
    );
  }

  const filteredCompanies = companies.filter((c) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="panel__header-row">
        <h2 className="panel__title">Sociétés</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher une société…" />
          <button className="btn btn--ghost" onClick={loadCompanies}>Rafraîchir</button>
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
                <th>Email</th>
                <th>Ville</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="clients-table__row--clickable" onClick={() => setSelectedId(company.id)}>
                  <td>{company.name}</td>
                  <td>{company.email || '—'}</td>
                  <td>{company.city || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDialogOpen && (
        <Dialog title="Nouvelle société" onClose={() => setIsDialogOpen(false)}>
          <CompanyForm onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}