import { useState } from 'react';
import { getUserName } from '../api/authToken';

export default function UserMenu({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const name = getUserName() || 'Mon compte';

  return (
    <div className="purchase-toolbar__menu" style={{ marginLeft: 'auto' }}>
      <button className="app-nav__tab" onClick={() => setIsOpen((v) => !v)}>
        {name} ▾
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="dropdown-menu__danger"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}