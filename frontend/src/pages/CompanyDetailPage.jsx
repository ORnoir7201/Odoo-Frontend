import { useEffect, useState, useCallback } from 'react';
import { getCompanyAdminDetail, updateCompanyAdmin } from '../api/companiesAdmin';
import Dialog from '../components/Dialog';
import CompanyForm from '../components/CompanyForm';

export default function CompanyDetailPage({ companyId, onBack }) {
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompany(await getCompanyAdminDetail(companyId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEditSubmit(formData) {
    setIsSubmitting(true);
    try {
      await updateCompanyAdmin(companyId, formData);
      setIsEditOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <p className="state-message">Chargement…</p>;
  if (error) return <p className="state-message state-message--error">{error}</p>;
  if (!company) return null;

  const addressParts = [
    company.street,
    company.street2,
    [company.zip, company.city].filter(Boolean).join(' '),
    company.country_id ? company.country_id[1] : null,
  ].filter(Boolean);

  return (
    <div>
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">
          <button className="btn btn--ghost" onClick={onBack}>← Retour</button>
          <button className="btn btn--soft" onClick={() => setIsEditOpen(true)}>Modifier</button>
        </div>
      </div>

      <div className="client-detail__identity" style={{ marginBottom: 24 }}>
        <div className="logo-uploader__preview">
          {company.logo ? <img src={`data:image/png;base64,${company.logo}`} alt={company.name} /> : <span>Aucun logo</span>}
        </div>
        <h2 style={{ margin: 0 }}>{company.name}</h2>
      </div>

      <section className="panel">
        <h3 className="panel__title">Informations générales</h3>
        <div className="purchase-info-grid">
          <div>
            <p className="field__label">Email</p>
            <p>{company.email || '—'}</p>
          </div>
          <div>
            <p className="field__label">Téléphone</p>
            <p>{company.phone || '—'}</p>
          </div>
          <div>
            <p className="field__label">Site web</p>
            <p>{company.website || '—'}</p>
          </div>
          <div>
            <p className="field__label">Numéro de TVA</p>
            <p>{company.vat || '—'}</p>
          </div>
          <div>
            <p className="field__label">Adresse</p>
            <p>{addressParts.length > 0 ? addressParts.join(', ') : '—'}</p>
          </div>
        </div>
      </section>

      
      {isEditOpen && (
        <Dialog title={`Modifier « ${company.name} »`} onClose={() => setIsEditOpen(false)}>
          <CompanyForm
            editingCompany={company}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      )}
    </div>
  );
}