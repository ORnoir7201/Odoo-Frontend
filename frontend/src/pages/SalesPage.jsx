import { useEffect, useState, useCallback } from 'react';
import { getSales, createSale, deleteSale } from '../api/sales';
import Dialog from '../components/Dialog';
import SaleForm from '../components/SaleForm';
import SalesTable from '../components/SalesTable';
import SaleDetailPage from './SaleDetailPage';
import SearchInput from '../components/SearchInput';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyMine, setOnlyMine] = useState(true);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSales(await getSales(onlyMine));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onlyMine]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createSale(formData);
      setIsDialogOpen(false);
      await loadSales();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(order) {
    const confirmed = window.confirm(`Supprimer définitivement le devis "${order.name}" ? Cette action est irréversible.`);
    if (!confirmed) return;

    try {
      await deleteSale(order.id);
      await loadSales();
    } catch (err) {
      alert(`Impossible de supprimer ce devis : ${err.message}`);
    }
  }

  if (selectedId) {
    return (
      <SaleDetailPage
        saleId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadSales();
        }}
        onDeleted={() => {
          setSelectedId(null);
          loadSales();
        }}
        onDuplicated={(newId) => setSelectedId(newId)}
      />
    );
  }

  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.partner_id ? s.partner_id[1] : '').toLowerCase().includes(term) ||
      (s.user_id ? s.user_id[1] : '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Devis & commandes clients</p>
        <h1>Ventes</h1>
        <p className="page__subtitle">
          Connecté en direct à l'instance Odoo — chaque devis créé ici est un vrai enregistrement
          du modèle <code>sale.order</code>.
        </p>
      </header>

      <section className="panel">
        <div className="panel__header-row">
          <h2 className="panel__title">Devis enregistrés</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {onlyMine ? (
              <span className="filter-chip">
                Mes Devis
                <button onClick={() => setOnlyMine(false)} aria-label="Retirer le filtre">✕</button>
              </span>
            ) : (
              <button className="btn btn--ghost" onClick={() => setOnlyMine(true)} style={{ fontSize: 13 }}>
                Mes Devis
              </button>
            )}
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un devis…" />
            <button className="btn btn--ghost" onClick={loadSales}>Rafraîchir</button>
            <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
          </div>
        </div>
        <SalesTable
          sales={filteredSales}
          isLoading={isLoading}
          error={error}
          onDelete={handleDelete}
          onRowClick={(order) => setSelectedId(order.id)}
        />
      </section>
    
      {isDialogOpen && (
        <Dialog title="Nouveau devis" onClose={() => setIsDialogOpen(false)}>
          <SaleForm onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}