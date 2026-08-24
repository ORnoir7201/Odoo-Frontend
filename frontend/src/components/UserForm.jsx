import { useEffect, useState } from 'react';
import { getLanguages } from '../api/users';
import { getCompanies } from '../api/companies';

const EMPTY_FORM = { name: '', login: '', password: '', lang: '', companyId: '' };

function toFormValues(user) {
  if (!user) return EMPTY_FORM;
  return {
    name: user.name || '',
    login: user.login || '',
    password: '',
    lang: user.lang || '',
    companyId: user.company_id ? String(user.company_id[0]) : '',
  };
}

export default function UserForm({ editingUser, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [companies, setCompanies] = useState([]);

  const isEditing = Boolean(editingUser);

  useEffect(() => {
    getLanguages().then(setLanguages).catch((err) => console.error('Langues:', err.message));
    getCompanies().then(setCompanies).catch((err) => console.error('Sociétés:', err.message));
  }, []);

  useEffect(() => {
    setForm(toFormValues(editingUser));
    setError(null);
  }, [editingUser]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Le nom est obligatoire.');
    if (!form.login.trim()) return setError("L'identifiant (email) est obligatoire.");
    if (!isEditing && !form.password.trim()) return setError('Le mot de passe est obligatoire à la création.');

    try {
      await onSubmit(form);
      if (!isEditing) setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="client-form__grid">
        <label className="field">
          <span className="field__label">Nom</span>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nom complet" autoComplete="off" />
        </label>
        <label className="field">
          <span className="field__label">Identifiant (email)</span>
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
        <label className="field">
          <span className="field__label">Société</span>
          <select name="companyId" value={form.companyId} onChange={handleChange}>
            <option value="">— Par défaut —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

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