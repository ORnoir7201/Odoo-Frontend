import { useEffect, useState } from 'react';
import { getCompanies } from '../api/companies';
import { getSaleTaxes } from '../api/sales';

const EMPTY_FORM = {
  name: '',
  reference: '',
  barcode: '',
  type: 'consu',
  price: '',
  cost: '',
  category: '',
  company: '',
  taxId: '',
  saleOk: true,
  purchaseOk: true,
  descriptionSale: '',
};

function toFormValues(product) {
  if (!product) return EMPTY_FORM;
  return {
    name: product.name || '',
    reference: product.default_code || '',
    barcode: product.barcode || '',
    type: product.type || 'consu',
    price: product.list_price != null ? String(product.list_price) : '',
    cost: product.standard_price != null ? String(product.standard_price) : '',
    category: product.categ_id ? product.categ_id[1] : '',
    company: product.company_id ? product.company_id[1] : '',
    taxId: product.taxes_id && product.taxes_id.length > 0 ? String(product.taxes_id[0]) : '',
    saleOk: product.sale_ok !== false,
    purchaseOk: product.purchase_ok !== false,
    descriptionSale: product.description_sale || '',
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProductForm({ editingProduct, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);

  const isEditing = Boolean(editingProduct);

  useEffect(() => {
    getCompanies().then(setCompanies).catch((err) => console.error('Sociétés:', err.message));
    getSaleTaxes().then(setTaxes).catch((err) => console.error('Taxes:', err.message));
  }, []);

  useEffect(() => {
    setForm(toFormValues(editingProduct));
    setPhotoPreview(editingProduct?.image ? `data:image/png;base64,${editingProduct.image}` : null);
    setNewPhotoBase64(null);
    setError(null);
  }, [editingProduct]);

  function handleChange(e) {
    const { name, type: inputType, value, checked } = e.target;
    setForm({ ...form, [name]: inputType === 'checkbox' ? checked : value });
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setNewPhotoBase64(base64);
    setPhotoPreview(`data:image/png;base64,${base64}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }

    try {
      await onSubmit({ ...form, photoBase64: newPhotoBase64 });
      if (!isEditing) {
        setForm(EMPTY_FORM);
        setPhotoPreview(null);
        setNewPhotoBase64(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="logo-uploader">
        <div className="logo-uploader__preview">
          {photoPreview ? <img src={photoPreview} alt={form.name} /> : <span>Aucune photo</span>}
        </div>
        <label className="btn btn--ghost">
          Ajouter/Changer la photo
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
        </label>
      </div>

      <div className="client-form__grid">
        <label className="field field--wide">
          <span className="field__label">Nom de l'article</span>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nom du produit" autoComplete="off" />
        </label>

        <label className="field">
          <span className="field__label">Peut être vendu</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
            <input type="checkbox" name="saleOk" checked={form.saleOk} onChange={handleChange} />
            <span style={{ fontSize: 14 }}>{form.saleOk ? 'Oui' : 'Non'}</span>
          </label>
        </label>

        <label className="field">
          <span className="field__label">Peut être acheté</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
            <input type="checkbox" name="purchaseOk" checked={form.purchaseOk} onChange={handleChange} />
            <span style={{ fontSize: 14 }}>{form.purchaseOk ? 'Oui' : 'Non'}</span>
          </label>
        </label>
      </div>

      <div className="client-form__grid">
        <label className="field">
          <span className="field__label">Type d'article</span>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="consu">Consommable</option>
            <option value="service">Service</option>
            <option value="product">Stockable</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">Catégorie d'article</span>
          <input name="category" value={form.category} onChange={handleChange} placeholder="Ex: Bureautique" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Référence interne</span>
          <input name="reference" value={form.reference} onChange={handleChange} placeholder="REF-001" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Code Barre</span>
          <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="000000000000" autoComplete="off" />
        </label>

        <label className="field">
          <span className="field__label">Prix de vente</span>
          <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0.00" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Taxes à la vente</span>
          <select name="taxId" value={form.taxId} onChange={handleChange}>
            <option value="">Aucune</option>
            {taxes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Coût</span>
          <input name="cost" type="number" step="0.01" min="0" value={form.cost} onChange={handleChange} placeholder="0.00" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Société</span>
          <select name="company" value={form.company} onChange={handleChange}>
            <option value="">— Par défaut —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field" style={{ marginBottom: 20 }}>
        <span className="field__label">Description commerciale</span>
        <textarea
          name="descriptionSale"
          value={form.descriptionSale}
          onChange={handleChange}
          rows={3}
          className="textarea-field"
          placeholder="Description visible sur les devis et factures"
        />
      </label>

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : 'Ajouter le produit'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}