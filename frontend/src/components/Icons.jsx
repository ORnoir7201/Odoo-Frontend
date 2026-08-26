const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconDashboard({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconContacts({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5" />
    </svg>
  );
}

export function IconProducts({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function IconSuppliers({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="1" y="7" width="13" height="10" rx="1" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="6" cy="19" r="1.6" />
      <circle cx="17.5" cy="19" r="1.6" />
    </svg>
  );
}

export function IconPurchases({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H6" />
    </svg>
  );
}

export function IconSales({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M3 17 9.5 10.5 13.5 14.5 21 6" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

export function IconSettings({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.65 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.35 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}