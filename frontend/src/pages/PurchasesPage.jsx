import { useEffect, useState, useCallback } from 'react';
import { getPurchases, createPurchase, deletePurchase } from '../api/purchases';
import Dialog from '../components/Dialog';
import PurchaseForm from '../components/PurchaseForm';
import PurchasesTable from '../components/PurchasesTable';
import PurchaseDetailPage from './PurchaseDetailPage';
import SearchInput from '../components/SearchInput';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadPurchases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPurchases(await getPurchases());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createPurchase(formData);
      setIsDialogOpen(false);
      await loadPurchases();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(order) {
    const confirmed = window.confirm(
      `Supprimer définitivement la commande "${order.name}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    try {
      await deletePurchase(order.id);
      await loadPurchases();
    } catch (err) {
      alert(`Impossible de supprimer cette commande : ${err.message}`);
    }
  }

  // Si une commande est sélectionnée, on affiche sa fiche détaillée
  // à la place de la liste — comme un "drill-down" façon Odoo.
  if (selectedId) {
    return (
      <PurchaseDetailPage
        purchaseId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadPurchases();
        }}
        onDeleted={() => {
          setSelectedId(null);
          loadPurchases();
        }}
        onDuplicated={(newId) => setSelectedId(newId)}
      />
    );
  }

  const filteredPurchases = purchases.filter((p) => {
  const term = searchTerm.toLowerCase();
  return (
    (p.name || '').toLowerCase().includes(term) ||
    (p.partner_id ? p.partner_id[1] : '').toLowerCase().includes(term) ||
    (p.supplier_id || '').toLowerCase().includes(term) ||
    (p.date_order || '').toLowerCase().includes(term) ||
    (p.date_planned || '').toLowerCase().includes(term) ||
    (p.company_id ? p.company_id[1] : '').toLowerCase().includes(term)

  );
});

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Commandes fournisseurs</p>
        <h1>Achats</h1>
        <p className="page__subtitle">
          Connecté en direct à l'instance Odoo — chaque commande créée ici est un vrai enregistrement
          du modèle <code>purchase.order</code>.
        </p>
      </header>

      <section className="panel">
        <div className="panel__header-row">
          <h2 className="panel__title">Commandes enregistrées</h2>
          <div style={{ display: 'flex', gap: 10 }}>

            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher une commande…" />
            <button className="btn btn--ghost" onClick={loadPurchases}>
              Rafraîchir
            </button>
            <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>
              + Créer
            </button>
          </div>
        </div>
        <PurchasesTable
          purchases={filteredPurchases}
          isLoading={isLoading}
          error={error}
          onDelete={handleDelete}
          onRowClick={(order) => setSelectedId(order.id)}
        />
      </section>

      {isDialogOpen && (
        <Dialog title="Nouvelle commande d'achat" onClose={() => setIsDialogOpen(false)}>
          <PurchaseForm
            onSubmit={handleCreate}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      )}
    </div>
  );
}