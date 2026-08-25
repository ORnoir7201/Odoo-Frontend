//import { useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage from './pages/SalesPage';
//import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { isLoggedIn, clearToken, getToken } from './api/authToken';
import { logout } from './api/auth';
import './App.css';
import CompanySwitcher from './components/CompanySwitcher';
import UserMenu from './components/UserMenu';
import ThemeSwitcher, { applyStoredTheme } from './components/ThemeSwitcher';
import { useState, useEffect } from 'react';
import ConfigurationPage from './pages/ConfigurationPage';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'clients', label: 'Contacts' },
  { id: 'products', label: 'Produits' },
  { id: 'suppliers', label: 'Fournisseurs' },
  { id: 'purchases', label: 'Achats' },
  { id: 'sales', label: 'Ventes' },
  { id: 'settings', label: 'Configuration' },
];

const PAGES = {
  dashboard: DashboardPage,
  clients: ClientsPage,
  products: ProductsPage,
  suppliers: SuppliersPage,
  purchases: PurchasesPage,
  sales: SalesPage,
  settings: ConfigurationPage,
};

function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [activeTab, setActiveTab] = useState('dashboard');
  useEffect(() => {
    applyStoredTheme();
  }, []);

  async function handleLogout() {
    const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
    if (!confirmed) return;

    const token = getToken();
    clearToken();
    setAuthenticated(false);
    if (token) {
      await logout(token);
    }
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={() => setAuthenticated(true)} />;
  }

  const ActivePage = PAGES[activeTab];

  return (
    <div className="app">
      <nav className="app-nav">
        <span className="app-nav__brand">Odoo Front</span>
        <div className="app-nav__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`app-nav__tab ${activeTab === tab.id ? 'app-nav__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ThemeSwitcher />
        <CompanySwitcher />
        <UserMenu onLogout={handleLogout} />
      </nav>

      <ActivePage onNavigate={setActiveTab} />
    </div>
  );
}

export default App;