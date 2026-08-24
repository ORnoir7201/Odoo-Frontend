import { useEffect, useState, useCallback } from 'react';
import { getSuppliers, createSupplier, deleteSupplier } from '../api/suppliers';
import Dialog from '../components/Dialog';
import SupplierForm from '../components/SupplierForm';
import SuppliersTable from '../components/SuppliersTable';
import SupplierDetailPage from './SupplierDetailPage';
import SearchInput from '../components/SearchInput';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSuppliers(await getSuppliers());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createSupplier(formData);
      setIsDialogOpen(false);
      await loadSuppliers();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(supplier) {
    if (!window.confirm(`Supprimer définitivement "${supplier.name}" ? Cette action est irréversible.`)) return;
    try {
      await deleteSupplier(supplier.id);
      await loadSuppliers();
    } catch (err) {
      alert(`Impossible de supprimer ce fournisseur : ${err.message}`);
    }
  }

  if (selectedId) {
    return (
      <SupplierDetailPage
        supplierId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadSuppliers();
        }}
        onDeleted={() => {
          setSelectedId(null);
          loadSuppliers();
        }}
      />
    );
  }

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Registre des fournisseurs</p>
        <h1>Fournisseurs</h1>
        <p className="page__subtitle">
          Connecté en direct à l'instance Odoo — chaque ligne ci-dessous est un contact réel marqué comme fournisseur dans <code>res.partner</code>.
        </p>
      </header>

      <section className="panel">
        <div className="panel__header-row">
          <h2 className="panel__title">Fournisseurs enregistrés</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un fournisseur…" />
            <button className="btn btn--ghost" onClick={loadSuppliers}>Rafraîchir</button>
            <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
          </div>
        </div>
        <SuppliersTable
          suppliers={filteredSuppliers}
          isLoading={isLoading}
          error={error}
          onRowClick={(supplier) => setSelectedId(supplier.id)}
          onDelete={handleDelete}
        />
      </section>

      {isDialogOpen && (
        <Dialog title="Nouveau fournisseur" onClose={() => setIsDialogOpen(false)}>
          <SupplierForm onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}