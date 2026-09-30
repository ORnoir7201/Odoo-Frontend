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
import { IconDashboard, IconContacts, IconProducts, IconSuppliers, IconPurchases, IconSales, IconSettings } from './components/Icons';
import ProjectsPage from './pages/ProjectsPage';
import { IconProjects2 } from './components/Icons';
import BackgroundDecoration from './components/BackgroundDecoration';
import InvoicingPage from './pages/InvoicingPage';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <IconDashboard size={16} /> },
  { id: 'clients', label: 'Clients', icon: <IconContacts size={16} /> },
  { id: 'products', label: 'Articles', icon: <IconProducts size={16} /> },
  { id: 'suppliers', label: 'Fournisseurs', icon: <IconSuppliers size={16} /> },
  { id: 'purchases', label: 'Achats', icon: <IconPurchases size={16} /> },
  { id: 'sales', label: 'Ventes', icon: <IconSales size={16} /> },
  { id: 'settings', label: 'Configuration', icon: <IconSettings size={16} /> },
  { id: 'projects', label: 'Projets', icon: <IconProjects2 size={16} /> },
  { id: 'invoicing', label: 'Facturation', icon: <IconPurchases size={16} /> },
];

const PAGES = {
  dashboard: DashboardPage,
  clients: ClientsPage,
  products: ProductsPage,
  suppliers: SuppliersPage,
  purchases: PurchasesPage,
  sales: SalesPage,
  settings: ConfigurationPage,
  projects: ProjectsPage,
  invoicing: InvoicingPage,
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
      <BackgroundDecoration />
      <nav className="app-nav">
        <span className="app-nav__brand">Odoo Front</span>
        <div className="app-nav__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`app-nav__tab ${activeTab === tab.id ? 'app-nav__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="app-nav__actions">
          <ThemeSwitcher />
          <CompanySwitcher />
          <UserMenu onLogout={handleLogout} />
        </div>
      </nav>

      <ActivePage onNavigate={setActiveTab} />
    </div>
  );
}

export default App;