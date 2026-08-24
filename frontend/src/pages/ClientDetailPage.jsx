import { useEffect, useState, useCallback } from 'react';

import { getClientDetail, updateClient, deleteClient } from '../api/clients';

import Dialog from '../components/Dialog';

import ClientForm from '../components/ClientForm';


function formatAddress(client) {
  const parts = [];

  if (client.street) parts.push(client.street);

  if (client.street2) parts.push(client.street2);

  const cityLine = [client.zip, client.city].filter(Boolean).join(' ');

  if (cityLine) parts.push(cityLine);

  if (client.country_id) parts.push(client.country_id[1]);

  return parts.length > 0 ? parts.join(', ') : '—';
}


export default function ClientDetailPage({ clientId, onBack, onDeleted }) {
  const [client, setClient] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);


  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setClient(await getClientDetail(clientId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);


  useEffect(() => {
    load();
  }, [load]);


  async function handleEditSubmit(formData) {
    setIsSubmitting(true);

    try {
      await updateClient(clientId, formData);
      setIsEditOpen(false);
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }


  async function handleDelete() {
    if (
      !window.confirm(
        `Supprimer définitivement "${client.name}" ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      await deleteClient(clientId);
      onDeleted?.();
    } catch (err) {
      alert(`Impossible de supprimer ce contact : ${err.message}`);
    }
  }


  if (isLoading) {
    return (
      <div className="page">
        <p className="state-message">Chargement…</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="page">
        <p className="state-message state-message--error">
          {error}
        </p>
      </div>
    );
  }


  if (!client) return null;


  return (
    <div className="page">

      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">

          <button
            className="btn btn--ghost"
            onClick={onBack}
          >
            ← Retour
          </button>

          <button
            className="btn btn--soft"
            onClick={() => setIsEditOpen(true)}
          >
            Modifier
          </button>

          <button
            className="btn btn--ghost"
            onClick={handleDelete}
          >
            Supprimer
          </button>

        </div>
      </div>


      <header className="page__header">

        <div className="client-detail__identity">

          <div className="logo-uploader__preview logo-uploader__preview--round logo-uploader__preview--lg">

            {client.image ? (
              <img
                src={`data:image/png;base64,${client.image}`}
                alt={client.name}
              />
            ) : (
              <span>Aucune photo</span>
            )}

          </div>

          <h1>{client.name}</h1>

        </div>

      </header>


      <section className="panel">

        <div className="purchase-info-grid">

          {/* Email */}
          <div>
            <p className="field__label">Email</p>
            <p>{client.email || '—'}</p>
          </div>


          {/* Téléphone */}
          <div>
            <p className="field__label">Téléphone</p>
            <p>{client.phone || '—'}</p>
          </div>


          {/* Téléphone mobile */}
          <div>
            <p className="field__label">Mobile</p>
            <p>{client.mobile || '—'}</p>
          </div>


          {/* Type de contact */}
          <div>
            <p className="field__label">Type</p>
            <p>
              {client.is_company ? 'Entreprise' : 'Personne'}
            </p>
          </div>


          {/* Site web */}
          <div>
            <p className="field__label">Site web</p>

            {client.website ? (
              <p>
                <a
                  href={
                    client.website.startsWith('http://') ||
                    client.website.startsWith('https://')
                      ? client.website
                      : `https://${client.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {client.website}
                </a>
              </p>
            ) : (
              <p>—</p>
            )}
          </div>


          {/* Numéro TVA */}
          <div>
            <p className="field__label">N° TVA</p>
            <p>{client.vat || '—'}</p>
          </div>


          {/* Adresse */}
          <div>
            <p className="field__label">Adresse</p>
            <p>{formatAddress(client)}</p>
          </div>


        </div>

      </section>


      {isEditOpen && (

        <Dialog
          title={`Modifier « ${client.name} »`}
          onClose={() => setIsEditOpen(false)}
        >

          <ClientForm
            editingClient={client}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            isSubmitting={isSubmitting}
          />

        </Dialog>

      )}

    </div>
  );
}