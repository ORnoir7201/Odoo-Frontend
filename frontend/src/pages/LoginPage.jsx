import { useState, useEffect } from 'react';
import { login, getDatabases } from '../api/auth';
import { setToken, setUserName } from '../api/authToken';
import { Eye, EyeOff } from 'lucide-react';

const DB_STORAGE_KEY = 'odoo_front_last_db';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(localStorage.getItem(DB_STORAGE_KEY) || '');
  const [dbError, setDbError] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getDatabases()
      .then((list) => {
        setDatabases(list);
        if (!selectedDb && list.length > 0) {
          setSelectedDb(list[0]);
        }
      })
      .catch((err) => setDbError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
     const data = await login(email, password, selectedDb);

      setToken(data.token);
      setUserName(data.name || data.email);
      localStorage.setItem(DB_STORAGE_KEY, selectedDb);

      onLoginSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">

      {/* =========================================
          PARTIE GAUCHE
          ========================================= */}

      <div className="login-visual">

        <div className="login-visual__content">

          <div className="login-brand">
            <div className="login-brand__icon">
              O
            </div>

            <span>Odoo Front</span>
          </div>

          <div className="login-visual__main">

            <span className="login-visual__eyebrow">
              GESTION COMMERCIALE
            </span>

            <h1>
              Gérez votre activité
              <br />
              <strong>simplement.</strong>
            </h1>

            <p>
              Retrouvez vos contacts, produits, fournisseurs,
              commandes et ventes dans une interface simple
              et moderne connectée à Odoo.
            </p>

          </div>

          {/* Décoration */}
          <div className="login-decoration">
            <div className="login-decoration__circle login-decoration__circle--one"></div>
            <div className="login-decoration__circle login-decoration__circle--two"></div>
            <div className="login-decoration__circle login-decoration__circle--three"></div>

            <div className="login-decoration__card">
              <span>Odoo</span>
              <strong>Front</strong>
            </div>
          </div>

          <p className="login-visual__footer">
            © 2026 Odoo Front. Tous droits réservés.
          </p>

        </div>

      </div>


      {/* =========================================
          PARTIE DROITE : FORMULAIRE
          ========================================= */}

      <div className="login-form-area">

        <form
          className="login-card"
          onSubmit={handleSubmit}
        >

          <div className="login-card__header">

            <span className="login-card__eyebrow">
              BIENVENUE
            </span>

            <h2 className="login-card__title">
              Connexion
            </h2>

            <p className="login-card__subtitle">
              Connectez-vous avec vos identifiants Odoo
              pour accéder à votre espace.
            </p>

          </div>

          {/* Base de données */}

<label className="field">
  <span className="field__label">Base de données</span>
  {databases.length > 0 ? (
    <select value={selectedDb} onChange={(e) => setSelectedDb(e.target.value)}>
      {databases.map((db) => (
        <option key={db} value={db}>{db}</option>
      ))}
    </select>
  ) : (
    <input
      value={selectedDb}
      onChange={(e) => setSelectedDb(e.target.value)}
      placeholder="Nom de la base"
      autoComplete="off"
    />
  )}
  {dbError && (
    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
      Liste indisponible — saisis le nom manuellement.
    </span>
  )}
</label>

          {/* Email */}

          <label className="field">

            <span className="field__label">
              Adresse email
            </span>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre adresse email"
              autoComplete="off"
              name="odoo-front-email"
              required
            />

          </label>


          {/* Mot de passe */}

          <label className="field">

            <div className="field__label-row">
              <span className="field__label">
                Mot de passe
              </span>

              <span className="field__forgot">
                Odoo
              </span>
            </div>

            <div className="password-input-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                name="odoo-front-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={1.8} />
                ) : (
                  <Eye size={20} strokeWidth={1.8} />
                )}
              </button>

            </div>

          </label>

          {/* Erreur */}

          {error && (
            <p className="client-form__error">
              {error}
            </p>
          )}


          {/* Bouton */}

          <button
            type="submit"
            className="btn btn--primary btn--full login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>


          <div className="login-divider">
            <span>Accès sécurisé via Odoo</span>
          </div>


          <p className="login-card__bottom">
            Votre espace de gestion
            <strong> Odoo Front</strong>
          </p>

        </form>

      </div>

    </div>
  );
}