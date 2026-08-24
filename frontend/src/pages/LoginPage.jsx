import { useState } from 'react';
import { login } from '../api/auth';
//import { setToken } from '../api/authToken';
import { setToken, setUserName } from '../api/authToken';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      setToken(data.token);
      setUserName(data.name || data.email);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="page__eyebrow">Odoo Front</p>
        <h1 className="login-card__title">Connexion</h1>
        <p className="login-card__subtitle">
          Utilise ton email et mot de passe Odoo habituels.
        </p>

        <label className="field">
  <span className="field__label">Email</span>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="ton.email@africanumerik.com"
    autoComplete="off"
    name="odoo-front-email"
    required
  />
</label>

<label className="field">
  <span className="field__label">Mot de passe</span>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="••••••••"
    autoComplete="new-password"
    name="odoo-front-password"
    required
  />
</label>

        {error && <p className="client-form__error">{error}</p>}

        <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}