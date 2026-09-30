import { useState } from 'react';
import { getUserName } from '../api/authToken';
import useClickOutside from '../hooks/useClickOutside';
import { IconUser } from './Icons';

function getInitials(name) {
  if (!name) return 'U';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function UserMenu({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useClickOutside(() => setIsOpen(false));
  const name = getUserName() || 'Mon compte';

  return (
    <div className="nav-icon-control" ref={menuRef}>
      <button
        className="nav-icon-control__button"
        onClick={() => setIsOpen((v) => !v)}
        title={`Compte : ${name}`}
      >
        <IconUser size={26} />
        <span className="nav-icon-control__initials">
          {getInitials(name)}
        </span>
      
      </button>

      {isOpen && (
        <div className="dropdown-menu nav-icon-control__dropdown nav-icon-control__dropdown--user">
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