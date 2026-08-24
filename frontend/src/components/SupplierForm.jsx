import { useEffect, useState } from 'react';

const EMPTY_FORM = {
  type: 'individual',
  name: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  vat: '',
  street: '',
  street2: '',
  city: '',
  zip: '',
  country: '',
};

function toFormValues(supplier) {
  if (!supplier) return EMPTY_FORM;
  return {
    type: supplier.is_company ? 'company' : 'individual',
    name: supplier.name || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    mobile: supplier.mobile || '',
    website: supplier.website || '',
    vat: supplier.vat || '',
    street: supplier.street || '',
    street2: supplier.street2 || '',
    city: supplier.city || '',
    zip: supplier.zip || '',
    country: supplier.country_id ? supplier.country_id[1] : '',
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

export default function SupplierForm({ editingSupplier, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);

  const isEditing = Boolean(editingSupplier);
  const isCompanyType = form.type === 'company';

  useEffect(() => {
    setForm(toFormValues(editingSupplier));
    setPhotoPreview(editingSupplier?.image ? `data:image/png;base64,${editingSupplier.image}` : null);
    setNewPhotoBase64(null);
    setError(null);
  }, [editingSupplier]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      setError(isCompanyType ? 'Le nom de la société est obligatoire.' : 'Le nom est obligatoire.');
      return;
    }

    try {
      await onSubmit({ ...form, isCompany: isCompanyType, photoBase64: newPhotoBase64 });
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
      <div className="type-toggle">
        <button
          type="button"
          className={`type-toggle__option ${form.type === 'individual' ? 'type-toggle__option--active' : ''}`}
          onClick={() => setForm({ ...form, type: 'individual' })}
        >
          Particulier
        </button>
        <button
          type="button"
          className={`type-toggle__option ${form.type === 'company' ? 'type-toggle__option--active' : ''}`}
          onClick={() => setForm({ ...form, type: 'company' })}
        >
          Société
        </button>
      </div>

      <div className="logo-uploader">
        <div className="logo-uploader__preview logo-uploader__preview--round">
          {photoPreview ? <img src={photoPreview} alt={form.name} /> : <span>Aucune photo</span>}
        </div>
        <label className="btn btn--ghost">
          Changer la photo
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
        </label>
      </div>

      <div className="client-form__grid">
        <label className="field field--wide">
          <span className="field__label">{isCompanyType ? 'Nom de la société' : 'Nom'}</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={isCompanyType ? "Nom de l'entreprise" : 'Nom du fournisseur'}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@exemple.com" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Téléphone</span>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="+226 00 00 00 00" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Mobile</span>
          <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="+226 00 00 00 00" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Site web</span>
          <input name="website" value={form.website} onChange={handleChange} placeholder="https://exemple.com" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Numéro de TVA</span>
          <input name="vat" value={form.vat} onChange={handleChange} placeholder="BF0000000000A" autoComplete="off" />
        </label>
      </div>

      <p className="client-form__section-label">Adresse</p>

      <div className="client-form__grid client-form__grid--address">
        <label className="field field--wide">
          <span className="field__label">Rue</span>
          <input name="street" value={form.street} onChange={handleChange} placeholder="Avenue Kwame N'Krumah" autoComplete="off" />
        </label>
        <label className="field field--wide">
          <span className="field__label">Complément</span>
          <input name="street2" value={form.street2} onChange={handleChange} placeholder="Bâtiment, étage..." autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Ville</span>
          <input name="city" value={form.city} onChange={handleChange} placeholder="Ouagadougou" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Code postal</span>
          <input name="zip" value={form.zip} onChange={handleChange} placeholder="01 BP 000" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Pays</span>
          <input name="country" value={form.country} onChange={handleChange} placeholder="Burkina Faso" autoComplete="off" />
        </label>
      </div>

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : 'Ajouter le fournisseur'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}