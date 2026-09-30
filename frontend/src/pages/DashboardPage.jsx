import { useEffect, useState, useCallback } from 'react';
import { getDashboardStats } from '../api/dashboard';
import StatCard from '../components/StatCard';
import { IconContacts, IconProducts, IconSuppliers, IconPurchases, IconSales } from '../components/Icons';

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value) + ' FCFA';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  // Odoo renvoie les dates au format "2026-07-17 10:32:00"
  return new Date(dateString.replace(' ', 'T')).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Vue d'ensemble</p>
        <h1>Tableau de bord</h1>
        <p className="page__subtitle">
          Statistiques en temps réel, directement calculées depuis Odoo.
        </p>
      </header>

      {isLoading && <p className="state-message">Chargement des statistiques…</p>}

      {error && (
        <p className="state-message state-message--error">
          Impossible de charger le tableau de bord : {error}
        </p>
      )}

      {stats && (
        <>
          <div className="stats-grid">
            <StatCard
              icon={<IconContacts size={24} />}
              label="Clients enregistrés"
              value={stats.contacts.total}
              onClick={() => onNavigate('clients')}
            />
            <StatCard
              icon={<IconProducts size={24} />}
              label="Article au catalogue"
              value={stats.products.total}
              onClick={() => onNavigate('products')}
            />
            <StatCard
              icon={<IconSuppliers size={24} />}
              label="Fournisseurs enregistrés"
              value={stats.suppliers.total}
              onClick={() => onNavigate('suppliers')}
            />
            <StatCard
              icon={<IconPurchases size={24} />}
              label="Commandes d'achat"
              value={stats.purchasers.total}
              onClick={() => onNavigate('purchases')}
            />
            <StatCard
              icon={<IconSales size={24} />}
              label="Ventes enregistrées"
              value={stats.sales.total}
              onClick={() => onNavigate('sales')}
            />
          </div>

          <div className="dashboard-columns">
            <section className="panel">
              <h2 className="panel__title">Derniers contacts ajoutés</h2>
              {stats.contacts.recent.length === 0 ? (
                <p className="state-message">Aucun contact pour l'instant.</p>
              ) : (
                <ul className="recent-list">
                  {stats.contacts.recent.map((c) => (
                    <li key={c.id} className="recent-list__item">
                      <span>{c.name}</span>
                      <span className="recent-list__date">{formatDate(c.create_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2 className="panel__title">Derniers articles ajoutés</h2>
              {stats.products.recent.length === 0 ? (
                <p className="state-message">Aucun article pour l'instant.</p>
              ) : (
                <ul className="recent-list">
                  {stats.products.recent.map((p) => (
                    <li key={p.id} className="recent-list__item">
                      <span>{p.name}</span>
                      <span className="recent-list__date">{formatDate(p.create_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <button className="btn btn--ghost" onClick={loadStats}>
            Rafraîchir
          </button>
        </>
      )}
    </div>
  );
}