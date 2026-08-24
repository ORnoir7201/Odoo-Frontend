import { useEffect, useState } from 'react';
import { getMyCompanySettings } from '../api/settings';

export default function DocumentFooter() {
  const [footerText, setFooterText] = useState(null);

  useEffect(() => {
    getMyCompanySettings()
      .then((company) => setFooterText(company.report_footer || null))
      .catch((err) => console.error('Impossible de charger le pied de page:', err.message));
  }, []);

  if (!footerText) return null;

  return (
    <div className="document-footer">
      <p>{footerText}</p>
    </div>
  );
}
