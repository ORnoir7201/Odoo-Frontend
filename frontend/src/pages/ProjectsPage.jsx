import { useEffect, useState, useCallback } from 'react';
import { getProjects, createProject } from '../api/projects';
import Dialog from '../components/Dialog';
import SearchInput from '../components/SearchInput';
import ProjectBoardPage from './ProjectBoardPage';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProjects(await getProjects());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject({ name: newName });
      setNewName('');
      setIsDialogOpen(false);
      await loadProjects();
    } catch (err) {
      alert(`Impossible de créer le projet : ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (selectedId) {
    return <ProjectBoardPage projectId={selectedId} onBack={() => { setSelectedId(null); loadProjects(); }} />;
  }

  const filteredProjects = projects.filter((p) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="page">
      <header className="page__header">
        <p className="page__eyebrow">Odoo · Gestion de projets</p>
        <h1>Projets</h1>
      </header>

      <div className="panel__header-row">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un projet…" />
        <button className="btn btn--primary" onClick={() => setIsDialogOpen(true)}>+ Créer</button>
      </div>

      {isLoading && <p className="state-message">Chargement…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!isLoading && !error && (
        <div className="project-cards-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card" onClick={() => setSelectedId(project.id)}>
              <p className="project-card__name">{project.name}</p>
              <p className="project-card__task-count">{project.task_count} Tâches</p>
            </div>
          ))}
          {filteredProjects.length === 0 && <p className="state-message">Aucun projet pour l'instant.</p>}
        </div>
      )}

      {isDialogOpen && (
        <Dialog title="Créer un projet." onClose={() => setIsDialogOpen(false)}>
          <form onSubmit={handleCreate}>
            <label className="field" style={{ marginBottom: 20 }}>
              <span className="field__label">Nom du projet</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="p.e. Fête au bureau"
                autoFocus
              />
            </label>
            <div className="client-form__actions">
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Création…' : 'Créer'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setIsDialogOpen(false)}>Annuler</button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}