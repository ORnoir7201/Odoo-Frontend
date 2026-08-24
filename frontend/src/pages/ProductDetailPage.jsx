import { useEffect, useState, useCallback } from 'react';
import { getProductDetail, updateProduct, deleteProduct } from '../api/products';
import Dialog from '../components/Dialog';
import ProductForm from '../components/ProductForm';

function formatPrice(price) {
  if (price == null) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(price) + ' FCFA';
}

export default function ProductDetailPage({ productId, onBack, onDeleted }) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProduct(await getProductDetail(productId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEditSubmit(formData) {
    setIsSubmitting(true);
    try {
      await updateProduct(productId, formData);
      setIsEditOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement "${product.name}" ? Cette action est irréversible.`)) return;
    try {
      await deleteProduct(productId);
      onDeleted?.();
    } catch (err) {
      alert(`Impossible de supprimer ce produit : ${err.message}`);
    }
  }

  if (isLoading) return <div className="page"><p className="state-message">Chargement…</p></div>;
  if (error) return <div className="page"><p className="state-message state-message--error">{error}</p></div>;
  if (!product) return null;

  return (
    <div className="page">
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">
          <button className="btn btn--ghost" onClick={onBack}>← Retour</button>
          <button className="btn btn--soft" onClick={() => setIsEditOpen(true)}>Modifier</button>
          <button className="btn btn--ghost" onClick={handleDelete}>Supprimer</button>
        </div>
      </div>

      <header className="page__header">
        <div className="client-detail__identity">
          <div className="logo-uploader__preview">
            {product.image ? <img src={`data:image/png;base64,${product.image}`} alt={product.name} /> : <span>Aucune photo</span>}
          </div>
          <div>
            <h1>{product.name}</h1>
            <span className="status-badge">{product.type_label}</span>
            {!product.sale_ok && <span className="status-badge status-badge--cancel" style={{ marginLeft: 6 }}>Non vendable</span>}
            {!product.purchase_ok && <span className="status-badge status-badge--cancel" style={{ marginLeft: 6 }}>Non achetable</span>}
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="purchase-info-grid">
          <div>
            <p className="field__label">Référence interne</p>
            <p>{product.default_code || '—'}</p>
          </div>
          <div>
            <p className="field__label">Code Barre</p>
            <p>{product.barcode || '—'}</p>
          </div>
          <div>
            <p className="field__label">Catégorie</p>
            <p>{product.categ_id ? product.categ_id[1] : '—'}</p>
          </div>
          <div>
            <p className="field__label">Société</p>
            <p>{product.company_id ? product.company_id[1] : '—'}</p>
          </div>
          <div>
            <p className="field__label">Prix de vente</p>
            <p>{formatPrice(product.list_price)}</p>
          </div>
          <div>
            <p className="field__label">Coût</p>
            <p>{formatPrice(product.standard_price)}</p>
          </div>
          <div>
            <p className="field__label">Stock disponible</p>
            <p>{product.qty_available ?? '—'}</p>
          </div>
        </div>

        {product.description_sale && (
          <>
            <p className="field__label" style={{ marginTop: 20 }}>Description commerciale</p>
            <p>{product.description_sale}</p>
          </>
        )}
      </section>

      {isEditOpen && (
        <Dialog title={`Modifier « ${product.name} »`} onClose={() => setIsEditOpen(false)}>
          <ProductForm
            editingProduct={product}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      )}
    </div>
  );
}