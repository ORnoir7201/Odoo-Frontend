import { useEffect, useState, useCallback } from 'react';
import { getLayouts, getMyCompanySettings, updateMyCompanySettings } from '../api/settings';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', website: '', vat: '',
  street: '', street2: '', city: '', zip: '',
  reportHeader: '', reportFooter: '', layoutId: '',
};

export default function SettingsPage({embedded}) {
  const [layouts, setLayouts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newLogoBase64, setNewLogoBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyCompanySettings();
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        vat: data.vat || '',
        street: data.street || '',
        street2: data.street2 || '',
        city: data.city || '',
        zip: data.zip || '',
        reportHeader: data.report_header || '',
        reportFooter: data.report_footer || '',
        layoutId: data.external_report_layout_id ? String(data.external_report_layout_id[0]) : '',
      });
      setLogoPreview(data.logo ? `data:image/png;base64,${data.logo}` : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getLayouts().then(setLayouts).catch((err) => console.error('Modèles de document:', err.message));
  }, [load]);

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
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      await updateMyCompanySettings({ ...form, logoBase64: newLogoBase64 });
      setSuccessMessage('Paramètres enregistrés avec succès.');
      setNewLogoBase64(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  
    
    const content = (
      <section className="panel">
        {isLoading ? (
          <p className="state-message">Chargement…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="client-form__section-label">Logo</p>
            <div className="logo-uploader">
              <div className="logo-uploader__preview">
                {logoPreview ? <img src={logoPreview} alt="Logo de la société" /> : <span>Aucun logo</span>}
              </div>
              <label className="btn btn--ghost">
                Changer le logo
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>

            <p className="client-form__section-label">Modèle de document</p>
            <label className="field" style={{ maxWidth: 400, marginBottom: 20 }}>
              <span className="field__label">Modèle visuel</span>
              <select name="layoutId" value={form.layoutId} onChange={handleChange}>
                <option value="">— Par défaut —</option>
                {layouts.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>

            <p className="client-form__section-label">Informations générales</p>
            <div className="client-form__grid">
              <label className="field">
                <span className="field__label">Nom de la société</span>
                <input name="name" value={form.name} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Email</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Téléphone</span>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Site web</span>
                <input name="website" value={form.website} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Numéro de TVA</span>
                <input name="vat" value={form.vat} onChange={handleChange} />
              </label>
            </div>

            <p className="client-form__section-label">Adresse</p>
            <div className="client-form__grid client-form__grid--address">
              <label className="field field--wide">
                <span className="field__label">Rue</span>
                <input name="street" value={form.street} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Complément</span>
                <input name="street2" value={form.street2} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Ville</span>
                <input name="city" value={form.city} onChange={handleChange} />
              </label>
              <label className="field">
                <span className="field__label">Code postal</span>
                <input name="zip" value={form.zip} onChange={handleChange} />
              </label>
            </div>

            <p className="client-form__section-label">Documents commerciaux</p>
            <div className="client-form__grid">
              <label className="field field--wide">
                <span className="field__label">Slogan de la société</span>
                <input
                  name="reportHeader"
                  value={form.reportHeader}
                  onChange={handleChange}
                  placeholder="Ex. : Global Business Solutions"
                />
              </label>
            </div>
            <label className="field" style={{ marginBottom: 20 }}>
              <span className="field__label">Pied de page des documents</span>
              <textarea
                name="reportFooter"
                value={form.reportFooter}
                onChange={handleChange}
                rows={3}
                className="textarea-field"
              />
            </label>

            {error && <p className="client-form__error">{error}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}

            <button type="submit" className="btn btn--primary" disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </form>
        )}
      </section>
    );
  
  if (embedded) {
    return content;
  }

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Paramètres généraux</p>
        <h1>Configuration</h1>
        <p className="page__subtitle">
          Le logo, le modèle et les informations définis ici s'appliquent automatiquement à tous
          vos documents (devis, factures, bons de commande...).
        </p>
      </header>
      {content}
    </div>
  );
  
}