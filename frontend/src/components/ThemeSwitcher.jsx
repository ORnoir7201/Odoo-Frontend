import { useEffect, useState } from 'react';

const THEMES = [
  { id: 'emerald', label: 'Émeraude' },
  { id: 'ocean', label: 'Océan' },
  { id: 'jour', label: 'Jour' },
  { id: 'night', label: 'Nuit' },
];

const STORAGE_KEY = 'odoo_front_theme';

export function applyStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored !== 'emerald') {
    document.documentElement.setAttribute('data-theme', stored);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(localStorage.getItem(STORAGE_KEY) || 'emerald');

  useEffect(() => {
    applyStoredTheme();
  }, []);

  function handleSelect(themeId) {
    localStorage.setItem(STORAGE_KEY, themeId);
    setCurrent(themeId);
    if (themeId === 'emerald') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    setIsOpen(false);
  }

  return (
    <div className="purchase-toolbar__menu">
      <button className="app-nav__tab" onClick={() => setIsOpen((v) => !v)} aria-label="Changer de style">
        🎨
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className="dropdown-menu__theme-option"
              onClick={() => handleSelect(theme.id)}
            >
              <span className={`theme-swatch theme-swatch--${theme.id}`}></span>
              {theme.label} {current === theme.id ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}