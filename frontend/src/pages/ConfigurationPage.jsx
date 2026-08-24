import { useState } from 'react';
import SettingsPage from './SettingsPage';
import UsersPage from './UsersPage';
import CompaniesAdminPage from './CompaniesAdminPage';

const SUB_TABS = [
  { id: 'general', label: 'Paramètres Généraux' },
  { id: 'users', label: 'Utilisateurs et sociétés' },
];

export default function ConfigurationPage() {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [usersSociety, setUsersSociety] = useState('users'); // sous-sous-onglet : users | companies

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Administration</p>
        <h1>Configuration</h1>
      </header>

      <div className="config-subtabs">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`config-subtabs__tab ${activeSubTab === tab.id ? 'config-subtabs__tab--active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'general' && <SettingsPage embedded />}

      {activeSubTab === 'users' && (
        <>
          <div className="config-subtabs config-subtabs--secondary">
            <button
              className={`config-subtabs__tab ${usersSociety === 'users' ? 'config-subtabs__tab--active' : ''}`}
              onClick={() => setUsersSociety('users')}
            >
              Utilisateurs
            </button>
            <button
              className={`config-subtabs__tab ${usersSociety === 'companies' ? 'config-subtabs__tab--active' : ''}`}
              onClick={() => setUsersSociety('companies')}
            >
              Sociétés
            </button>
          </div>

          <section className="panel">
            {usersSociety === 'users' ? <UsersPage /> : <CompaniesAdminPage />}
          </section>
        </>
      )}
    </div>
  );
}