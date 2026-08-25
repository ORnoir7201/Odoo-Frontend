import { useEffect, useState } from 'react';
import { getMyCompanies, switchCompany } from '../api/settings';
import useClickOutside from '../hooks/useClickOutside';

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

  // Une seule société ? Pas besoin d'afficher un sélecteur.
  if (companies.length <= 1) return null;

  const activeCompany = companies.find((c) => c.id === activeCompanyId);

  async function handleSwitch(companyId) {
    if (companyId === activeCompanyId) {
      setIsOpen(false);
      return;
    }
    setIsSwitching(true);
    try {
      await switchCompany(companyId);
      // On recharge toute la page : le plus simple et le plus fiable pour
      // que TOUTES les données affichées reflètent la nouvelle société.
      window.location.reload();
    } catch (err) {
      alert(`Impossible de changer de société : ${err.message}`);
      setIsSwitching(false);
    }
  }

  return (
    <div className="purchase-toolbar__menu" ref={menuRef}>
      <button className="app-nav__tab" onClick={() => setIsOpen((v) => !v)} disabled={isSwitching}>
        {activeCompany ? activeCompany.name : '—'} ▾
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {companies.map((c) => (
            <button key={c.id} onClick={() => handleSwitch(c.id)}>
              {c.id === activeCompanyId ? '✓ ' : ''}{c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}