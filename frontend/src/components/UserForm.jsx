import { useEffect, useState } from 'react';
import { getLanguages, getAppAccessFields } from '../api/users';
import { getCompanies } from '../api/companies';

const EMPTY_FORM = { name: '', login: '', password: '', lang: '', companyId: '', companyIds: [] };

function toFormValues(user) {
  if (!user) return EMPTY_FORM;
  return {
    name: user.name || '',
    login: user.login || '',
    password: '',
    lang: user.lang || '',
    companyId: user.company_id ? String(user.company_id[0]) : '',
    companyIds: user.company_ids || [],
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

export default function UserForm({ editingUser, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [appAccessFields, setAppAccessFields] = useState([]);
  const [appAccessValues, setAppAccessValues] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);

  const isEditing = Boolean(editingUser);

  useEffect(() => {
    getLanguages().then(setLanguages).catch((err) => console.error('Langues:', err.message));
    getCompanies().then(setCompanies).catch((err) => console.error('Sociétés:', err.message));
  }, []);

  useEffect(() => {
    setForm(toFormValues(editingUser));
    setError(null);
    setPhotoPreview(editingUser?.image ? `data:image/png;base64,${editingUser.image}` : null);
    setNewPhotoBase64(null);

    if (editingUser && editingUser.appAccess) {
      setAppAccessFields(editingUser.appAccess);
      setAppAccessValues(Object.fromEntries(editingUser.appAccess.map((f) => [f.field, f.value || ''])));
    } else {
      getAppAccessFields()
        .then((fields) => {
          setAppAccessFields(fields.map((f) => ({ ...f, value: '' })));
          setAppAccessValues(Object.fromEntries(fields.map((f) => [f.field, ''])));
        })
        .catch((err) => console.error('Accès applications:', err.message));
    }
  }, [editingUser]);

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

  function handleCompanyToggle(companyId) {
    setForm((prev) => {
      const exists = prev.companyIds.includes(companyId);
      const companyIds = exists
        ? prev.companyIds.filter((id) => id !== companyId)
        : [...prev.companyIds, companyId];
      // Si la société courante n'est plus dans les sociétés autorisées, on la retire.
      const companyId2 = companyIds.includes(Number(prev.companyId)) ? prev.companyId : '';
      return { ...prev, companyIds, companyId: companyId2 };
    });
  }

  function handleAppAccessChange(field, value) {
    setAppAccessValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Le nom est obligatoire.');
    if (!form.login.trim()) return setError("L'identifiant (email) est obligatoire.");
    if (!isEditing && !form.password.trim()) return setError('Le mot de passe est obligatoire à la création.');

    try {
      await onSubmit({ ...form, appAccess: appAccessValues, photoBase64: newPhotoBase64 });
      if (!isEditing) setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    }
  }

  // La "Société Courante" ne peut être choisie que parmi les sociétés autorisées.
  const authorizedCompanies = companies.filter((c) => form.companyIds.includes(c.id));

  return (
    <form className="client-form" onSubmit={handleSubmit}>
            <div className="logo-uploader">
        <div className="logo-uploader__preview logo-uploader__preview--round">
          {photoPreview ? <img src={photoPreview} alt={form.name} /> : <span>Aucune photo</span>}
        </div>
        <label className="btn btn--ghost">
          Ajouter/Changer la photo
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="client-form__grid">
        <label className="field">
          <span className="field__label">Nom</span>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nom complet" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Adresse électronique</span>
          <input name="login" type="email" value={form.login} onChange={handleChange} placeholder="prenom.nom@entreprise.com" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">{isEditing ? 'Nouveau mot de passe' : 'Mot de passe'}</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={isEditing ? 'Laisser vide pour ne pas changer' : '••••••••'}
            autoComplete="new-password"
          />
        </label>
        <label className="field">
          <span className="field__label">Langue</span>
          <select name="lang" value={form.lang} onChange={handleChange}>
            <option value="">— Par défaut —</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="client-form__section-label">Multi Sociétés</p>

      <div className="field" style={{ marginBottom: 16 }}>
        <span className="field__label">Sociétés autorisées</span>
        <div className="company-checklist">
          {companies.map((c) => (
            <label key={c.id} className="company-checklist__item">
              <input
                type="checkbox"
                checked={form.companyIds.includes(c.id)}
                onChange={() => handleCompanyToggle(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <label className="field" style={{ maxWidth: 320, marginBottom: 20 }}>
        <span className="field__label">Société Courante</span>
        <select name="companyId" value={form.companyId} onChange={handleChange} disabled={authorizedCompanies.length === 0}>
          <option value="">— Sélectionner —</option>
          {authorizedCompanies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      {appAccessFields.length > 0 && (
        <>
          <p className="client-form__section-label">Accès des applications</p>
          <div className="client-form__grid">
            {appAccessFields.map((f) => (
              <label key={f.field} className="field">
                <span className="field__label">{f.label}</span>
                <select value={appAccessValues[f.field] || ''} onChange={(e) => handleAppAccessChange(f.field, e.target.value)}>
                  <option value="">Aucun accès</option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </>
      )}

      {error && <p className="client-form__error">{error}</p>}

      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : "Créer l'utilisateur"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}