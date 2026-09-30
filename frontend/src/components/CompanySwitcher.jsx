import { useEffect, useState } from 'react';
import { getMyCompanies, switchCompany } from '../api/settings';
import useClickOutside from '../hooks/useClickOutside';
import { IconBuilding } from './Icons';

function getInitials(name) {
  if (!name) return '—';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function CompanySwitcher() {
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useClickOutside(() => setIsOpen(false));
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    getMyCompanies()
      .then((data) => {
        setCompanies(data.companies);
        setActiveCompanyId(data.activeCompanyId);
      })
      .catch((err) => console.error('Sociétés accessibles:', err.message));
  }, []);

  if (companies.length <= 1) return null;

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const companyName = activeCompany ? activeCompany.name : '—';

  async function handleSwitch(companyId) {
    if (companyId === activeCompanyId) {
      setIsOpen(false);
      return;
    }
    setIsSwitching(true);
    try {
      await switchCompany(companyId);
      window.location.reload();
    } catch (err) {
      alert(`Impossible de changer de société : ${err.message}`);
      setIsSwitching(false);
    }
  }

  return (
    <div className="nav-icon-control" ref={menuRef}>
      <button
        className="nav-icon-control__button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={isSwitching}
        title={`Entreprise : ${companyName}`}
      >
        <IconBuilding size={26} />
        <span className="nav-icon-control__initials">
          {getInitials(companyName)}
        </span>
        
      </button>

      {isOpen && (
        <div className="dropdown-menu nav-icon-control__dropdown">
          {companies.map((c) => (
            <button key={c.id} onClick={() => handleSwitch(c.id)}>
              <span className="nav-dropdown__avatar nav-avatar--company">
                {getInitials(c.name)}
              </span>
              <span className="nav-dropdown__name">{c.name}</span>
              {c.id === activeCompanyId && (
                <span className="nav-dropdown__check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}