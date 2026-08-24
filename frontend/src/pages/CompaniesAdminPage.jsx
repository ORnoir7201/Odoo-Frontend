import { useEffect, useState, useCallback } from 'react';
import { getCompaniesAdmin, getCompanyAdminDetail, createCompanyAdmin, updateCompanyAdmin } from '../api/companiesAdmin';
import { getLayouts } from '../api/settings';
import Dialog from '../components/Dialog';
import SearchInput from '../components/SearchInput';

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

function CompanyFormDialog({ companyId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [layouts, setLayouts] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newLogoBase64, setNewLogoBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(companyId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(companyId);

  useEffect(() => {
    getLayouts().then(setLayouts).catch((err) => console.error('Modèles:', err.message));
  }, []);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    getCompanyAdminDetail(companyId)
      .then((data) => {
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
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [companyId]);

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

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateCompanyAdmin(companyId, { ...form, logoBase64: newLogoBase64 });
      } else {
        await createCompanyAdmin(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog title={isEditing ? `Modifier « ${form.name} »` : 'Nouvelle société'} onClose={onClose}>
      {isLoading ? (
        <p className="state-message">Chargement…</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {isEditing && (
            <div className="logo-uploader">
              <div className="logo-uploader__preview">
                {logoPreview ? <img src={logoPreview} alt={form.name} /> : <span>Aucun logo</span>}
              </div>
              <label className="btn btn--ghost">
                Changer le logo
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>
          )}

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

          {isEditing && (
            <>
              <p className="client-form__section-label">Documents commerciaux</p>
              <label className="field" style={{ maxWidth: 400, marginBottom: 16 }}>
                <span className="field__label">Modèle visuel</span>
                <select name="layoutId" value={form.layoutId} onChange={handleChange}>
                  <option value="">— Par défaut —</option>
                  {layouts.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ marginBottom: 16 }}>
                <span className="field__label">Slogan de la société</span>
                <input name="reportHeader" value={form.reportHeader} onChange={handleChange} autoComplete="off" />
              </label>
              <label className="field" style={{ marginBottom: 20 }}>
                <span className="field__label">Pied de page des documents</span>
                <textarea name="reportFooter" value={form.reportFooter} onChange={handleChange} rows={3} className="textarea-field" />
              </label>
            </>
          )}

          {error && <p className="client-form__error">{error}</p>}

          <div className="client-form__actions">
            <button type="submit" className="btn btn--primary" disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Créer la société'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export default function CompaniesAdminPage() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogState, setDialogState] = useState(null); // null | 'create' | companyId

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompanies(await getCompaniesAdmin());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  function handleSaved() {
    setDialogState(null);
    loadCompanies();
  }

  const filteredCompanies = companies.filter((c) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="panel__header-row">
        <h2 className="panel__title">Sociétés</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher une société…" />
          <button className="btn btn--ghost" onClick={loadCompanies}>Rafraîchir</button>
          <button className="btn btn--primary" onClick={() => setDialogState('create')}>+ Créer</button>
        </div>
      </div>

      {isLoading && <p className="state-message">Chargement…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!isLoading && !error && (
        <div className="table-scroll">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Ville</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="clients-table__row--clickable" onClick={() => setDialogState(company.id)}>
                  <td>{company.name}</td>
                  <td>{company.email || '—'}</td>
                  <td>{company.city || '—'}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogState !== null && (
        <CompanyFormDialog
          companyId={dialogState === 'create' ? null : dialogState}
          onClose={() => setDialogState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}