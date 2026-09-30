import { useEffect, useState } from 'react';
import { getLayouts } from '../api/settings';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', website: '', vat: '',
  street: '', street2: '', city: '', zip: '',
  reportHeader: '', reportFooter: '', layoutId: '',
};

function toFormValues(company) {
  if (!company) return EMPTY_FORM;
  return {
    name: company.name || '',
    email: company.email || '',
    phone: company.phone || '',
    website: company.website || '',
    vat: company.vat || '',
    street: company.street || '',
    street2: company.street2 || '',
    city: company.city || '',
    zip: company.zip || '',
    reportHeader: company.report_header || '',
    reportFooter: company.report_footer || '',
    layoutId: company.external_report_layout_id ? String(company.external_report_layout_id[0]) : '',
  };
}

export default function CompanyForm({ editingCompany, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newLogoBase64, setNewLogoBase64] = useState(null);

  const isEditing = Boolean(editingCompany);

  useEffect(() => {
    getLayouts().then(setLayouts).catch((err) => console.error('Modèles de document:', err.message));
  }, []);

  useEffect(() => {
    setForm(toFormValues(editingCompany));
    setLogoPreview(editingCompany?.logo ? `data:image/png;base64,${editingCompany.logo}` : null);
    setNewLogoBase64(null);
    setError(null);
  }, [editingCompany]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setNewLogoBase64(base64);
    setLogoPreview(`data:image/png;base64,${base64}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Le nom de la société est obligatoire.');

    try {
      await onSubmit({ ...form, logoBase64: newLogoBase64 });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      
        <div className="logo-uploader">
          <div className="logo-uploader__preview">
            {logoPreview ? <img src={logoPreview} alt={form.name} /> : <span>Aucun logo</span>}
          </div>
          <label className="btn btn--ghost">
            Ajouter / Changer le logo
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
          </label>
        </div>
      

      <div className="client-form__grid">
        <label className="field field--wide">
          <span className="field__label">Nom de la société</span>
          <input name="name" value={form.name} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Téléphone</span>
          <input name="phone" value={form.phone} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Site web</span>
          <input name="website" value={form.website} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Numéro de TVA</span>
          <input name="vat" value={form.vat} onChange={handleChange} autoComplete="off" />
        </label>
      </div>

      <p className="client-form__section-label">Adresse</p>
      <div className="client-form__grid client-form__grid--address">
        <label className="field field--wide">
          <span className="field__label">Rue</span>
          <input name="street" value={form.street} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field field--wide">
          <span className="field__label">Complément</span>
          <input name="street2" value={form.street2} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Ville</span>
          <input name="city" value={form.city} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Code postal</span>
          <input name="zip" value={form.zip} onChange={handleChange} autoComplete="off" />
        </label>
      </div>

      

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : 'Créer la société'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}