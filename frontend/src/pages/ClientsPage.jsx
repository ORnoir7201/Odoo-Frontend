import { useEffect, useState, useCallback } from 'react';
import { getClients, createClient, deleteClient } from '../api/clients';
import Dialog from '../components/Dialog';
import ClientForm from '../components/ClientForm';
import ClientsTable from '../components/ClientsTable';
import ClientDetailPage from './ClientDetailPage';
import SearchInput from '../components/SearchInput';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);


  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setClients(await getClients());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createClient(formData);
      setIsDialogOpen(false);
      await loadClients();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(client) {
    if (!window.confirm(`Supprimer définitivement "${client.name}" ? Cette action est irréversible.`)) return;
    try {
      await deleteClient(client.id);
      await loadClients();
    } catch (err) {
      alert(`Impossible de supprimer ce contact : ${err.message}`);
    }
  }

  if (selectedId) {
    return (
      <ClientDetailPage
        clientId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadClients();
        }}
        onDeleted={() => {
          setSelectedId(null);
          loadClients();
        }}
      />
    );
  }

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (c.city || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Registre des clients</p>
        <h1>Clients</h1>
        <p className="page__subtitle">
          Connecté en direct à l'instance Odoo — chaque ligne ci-dessous est un contact réel marqué comme client dans <code>res.partner</code>.
        </p>
      </header>

      <section className="panel">
        <div className="panel__header-row">
          <h2 className="panel__title">Clients enregistrés</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un client…" />
            <button className="btn btn--ghost" onClick={loadClients}>Rafraîchir</button>
            <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
          </div>
        </div>
        <ClientsTable
          clients={filteredClients}
          isLoading={isLoading}
          error={error}
          onRowClick={(client) => setSelectedId(client.id)}
          onDelete={handleDelete}
        />
      </section>

      {isDialogOpen && (
        <Dialog title="Nouveau client" onClose={() => setIsDialogOpen(false)}>
          <ClientForm onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}