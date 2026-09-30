import { useEffect, useState, useCallback } from 'react';
import { getProducts, createProduct, deleteProduct } from '../api/products';
import Dialog from '../components/Dialog';
import ProductForm from '../components/ProductForm';
import ProductsTable from '../components/ProductsTable';
import ProductDetailPage from './ProductDetailPage';
import SearchInput from '../components/SearchInput';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleCreate(formData) {
    setIsSubmitting(true);
    try {
      await createProduct(formData);
      setIsDialogOpen(false);
      await loadProducts();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Supprimer définitivement "${product.name}" ? Cette action est irréversible.`)) return;
    try {
      await deleteProduct(product.id);
      await loadProducts();
    } catch (err) {
      alert(`Impossible de supprimer ce produit : ${err.message}`);
    }
  }

  if (selectedId) {
    return (
      <ProductDetailPage
        productId={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadProducts();
        }}
        onDeleted={() => {
          setSelectedId(null);
          loadProducts();
        }}
      />
    );
  }

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.default_code || '').toLowerCase().includes(term) ||
      (p.barcode || '').toLowerCase().includes(term) ||
      (p.categ_id ? p.categ_id[1] : '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Catalogue articles</p>
        <h1>Articles</h1>
        <p className="page__subtitle">
          Connecté en direct à l'instance Odoo — chaque ligne ci-dessous est un enregistrement réel du modèle <code>product.product</code>.
        </p>
      </header>

      <section className="panel">
        <div className="panel__header-row">
          <h2 className="panel__title">Articles enregistrés</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un article…" />
            <button className="btn btn--ghost" onClick={loadProducts}>Rafraîchir</button>
            <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
          </div>
        </div>
        <ProductsTable
          products={filteredProducts}
          isLoading={isLoading}
          error={error}
          onRowClick={(product) => setSelectedId(product.id)}
          onDelete={handleDelete}
        />
      </section>

      {isDialogOpen && (
        <Dialog title="Nouvel Article" onClose={() => setIsDialogOpen(false)}>
          <ProductForm onSubmit={handleCreate} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
        </Dialog>
      )}
    </div>
  );
}