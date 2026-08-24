import { useEffect, useState } from 'react';
import { getMyCompanySettings } from '../api/settings';

export default function DocumentHeader() {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    getMyCompanySettings()
      .then(setCompany)
      .catch((err) => console.error('Impossible de charger les infos société:', err.message));
  }, []);

  if (!company) return null;

  const addressParts = [company.street, [company.zip, company.city].filter(Boolean).join(' ')].filter(Boolean);

  return (
    <div className="document-header">
      <div className="document-header__logo">
        {company.logo ? (
          <img src={`data:image/png;base64,${company.logo}`} alt={company.name} />
        ) : (
          <span className="document-header__company-name">{company.name}</span>
        )}
      </div>

      <div className="document-header__info">
        {company.logo && <p className="document-header__company-name">{company.name}</p>}
        {company.report_header && <p className="document-header__tagline">{company.report_header}</p>}
        {addressParts.map((line) => <p key={line}>{line}</p>)}
        {company.phone && <p>Tél : {company.phone}</p>}
        {company.email && <p>{company.email}</p>}
        {company.website && <p>{company.website}</p>}
        {company.vat && <p>NIF/TVA : {company.vat}</p>}
      </div>
    </div>
  );
}