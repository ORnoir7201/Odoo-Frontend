import { useEffect, useState, useCallback } from 'react';
import { getSupplierDetail, updateSupplier, deleteSupplier } from '../api/suppliers';
import Dialog from '../components/Dialog';
import SupplierForm from '../components/SupplierForm';

function formatAddress(supplier) {
  const parts = [];
  if (supplier.street) parts.push(supplier.street);
  const cityLine = [supplier.zip, supplier.city].filter(Boolean).join(' ');
  if (cityLine) parts.push(cityLine);
  if (supplier.country_id) parts.push(supplier.country_id[1]);
  return parts.length > 0 ? parts.join(', ') : '—';
}

export default function SupplierDetailPage({ supplierId, onBack, onDeleted }) {
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSupplier(await getSupplierDetail(supplierId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEditSubmit(formData) {
    setIsSubmitting(true);
    try {
      await updateSupplier(supplierId, formData);
      setIsEditOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement "${supplier.name}" ? Cette action est irréversible.`)) return;
    try {
      await deleteSupplier(supplierId);
      onDeleted?.();
    } catch (err) {
      alert(`Impossible de supprimer ce fournisseur : ${err.message}`);
    }
  }

  if (isLoading) return <div className="page"><p className="state-message">Chargement…</p></div>;
  if (error) return <div className="page"><p className="state-message state-message--error">{error}</p></div>;
  if (!supplier) return null;

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
          <div className="logo-uploader__preview logo-uploader__preview--round logo-uploader__preview--lg">
            {supplier.image ? <img src={`data:image/png;base64,${supplier.image}`} alt={supplier.name} /> : <span>Aucune photo</span>}
          </div>
          <div>
            <h1>{supplier.name}</h1>
            <span className="status-badge">{supplier.is_company ? 'Société' : 'Particulier'}</span>
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="purchase-info-grid">
          <div>
            <p className="field__label">Email</p>
            <p>{supplier.email || '—'}</p>
          </div>
          <div>
            <p className="field__label">Téléphone</p>
            <p>{supplier.phone || '—'}</p>
          </div>
          <div>
            <p className="field__label">Mobile</p>
            <p>{supplier.mobile || '—'}</p>
          </div>
          <div>
            <p className="field__label">Site web</p>
            <p>{supplier.website || '—'}</p>
          </div>
          <div>
            <p className="field__label">Numéro de TVA</p>
            <p>{supplier.vat || '—'}</p>
          </div>
          <div>
            <p className="field__label">Adresse</p>
            <p>{formatAddress(supplier)}</p>
          </div>
        </div>
      </section>

      {isEditOpen && (
        <Dialog title={`Modifier « ${supplier.name} »`} onClose={() => setIsEditOpen(false)}>
          <SupplierForm
            editingSupplier={supplier}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      )}
    </div>
  );
}