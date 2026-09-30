import { useEffect, useState, useCallback } from 'react';
import {
  getProjectBoard, createStage, updateStage, deleteStage,
  toggleFoldStage, archiveStageTasks, createTask, toggleTaskPriority,
} from '../api/projects';
import { getUsers } from '../api/users';
import Dialog from '../components/Dialog';
import TaskCard from '../components/TaskCard';
import TaskFormDialog from '../components/TaskFormDialog';
import useClickOutside from '../hooks/useClickOutside';

function AddTaskForm({ stageId, projectId, users, onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({ name: title, projectId, stageId, userId: userId || null });
      onCreated();
    } catch (err) {
      alert(`Impossible de créer la tâche : ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <label className="field" style={{ marginBottom: 10 }}>
        <span className="field__label">Titre de la tâche</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label className="field" style={{ marginBottom: 12 }}>
        <span className="field__label">Assigné à</span>
        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">— Non assigné —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </label>
      <div className="client-form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? '…' : 'Ajouter'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

function StageMenu({ stage, onRenamed, onDeleted, onFolded, onArchived }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(stage.name);
  const menuRef = useClickOutside(() => setIsOpen(false));

  async function handleRenameSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await updateStage(stage.id, newName);
    setIsRenaming(false);
    setIsOpen(false);
    onRenamed();
  }

  async function handleDelete() {
    setIsOpen(false);
    if (!window.confirm(`Supprimer l'étape "${stage.name}" ?`)) return;
    try {
      await deleteStage(stage.id);
      onDeleted();
    } catch (err) {
      alert(`Impossible de supprimer : ${err.message}`);
    }
  }

  async function handleFold() {
    setIsOpen(false);
    await toggleFoldStage(stage.id, !stage.fold);
    onFolded();
  }

  async function handleArchiveAll(active) {
    setIsOpen(false);
    if (!window.confirm(active ? 'Réactiver toutes les tâches de cette étape ?' : 'Archiver toutes les tâches de cette étape ?')) return;
    await archiveStageTasks(stage.id, active);
    onArchived();
  }

  if (isRenaming) {
    return (
      <form onSubmit={handleRenameSubmit} style={{ display: 'flex', gap: 4 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          autoFocus
          style={{ fontSize: 13, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 6 }}
        />
      </form>
    );
  }

  return (
    <div className="purchase-toolbar__menu" ref={menuRef}>
      <button className="stage-column__gear" onClick={() => setIsOpen((v) => !v)} aria-label="Options de l'étape">⚙</button>
      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={handleFold}>{stage.fold ? 'Déplier' : 'Plier'}</button>
          <button onClick={() => { setIsRenaming(true); setIsOpen(false); }}>Éditer l'étape</button>
          <button onClick={handleDelete} className="dropdown-menu__danger">Supprimer</button>
          <button onClick={() => handleArchiveAll(false)}>Tout Archiver</button>
          <button onClick={() => handleArchiveAll(true)}>Tout Désarchiver</button>
        </div>
      )}
    </div>
  );
}

export default function ProjectBoardPage({ projectId, onBack }) {
  const [board, setBoard] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToStage, setAddingToStage] = useState(null);
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [openTaskId, setOpenTaskId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBoard(await getProjectBoard(projectId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
    getUsers().then(setUsers).catch((err) => console.error('Utilisateurs:', err.message));
  }, [load]);

  async function handleTogglePriority(taskId) {
    await toggleTaskPriority(taskId);
    load();
  }

  async function handleAddStage(e) {
    e.preventDefault();
    if (!newStageName.trim()) return;
    try {
      await createStage(projectId, newStageName);
      setNewStageName('');
      setIsAddStageOpen(false);
      load();
    } catch (err) {
      alert(`Impossible de créer l'étape : ${err.message}`);
    }
  }

  if (isLoading) return <div className="page"><p className="state-message">Chargement…</p></div>;
  if (error) return <div className="page"><p className="state-message state-message--error">{error}</p></div>;
  if (!board) return null;

  return (
    <div className="page page--wide">
      <div className="purchase-toolbar">
        <div className="purchase-toolbar__group">
          <button className="btn btn--ghost" onClick={onBack}>← Retour</button>
        </div>
      </div>

      <header className="page__header">
        <p className="page__eyebrow">Projets / Tâches</p>
        <h1>{board.project.name}</h1>
      </header>

      <div className="kanban-board">
        {board.stages.map((stage) => (
          <div key={stage.id} className={`stage-column ${stage.fold ? 'stage-column--folded' : ''}`}>
            <div className="stage-column__header">
              <span className="stage-column__title">{stage.name}</span>
              <div className="stage-column__actions">
                <StageMenu
                  stage={stage}
                  onRenamed={load}
                  onDeleted={load}
                  onFolded={load}
                  onArchived={load}
                />
                <button
                  className="stage-column__add"
                  onClick={() => setAddingToStage(stage.id)}
                  aria-label="Ajouter une tâche"
                >
                  +
                </button>
              </div>
            </div>
            <p className="stage-column__count">{stage.tasks.length}</p>

            {!stage.fold && (
              <div className="stage-column__tasks">
                {addingToStage === stage.id && (
                  <AddTaskForm
                    stageId={stage.id}
                    projectId={projectId}
                    users={users}
                    onCreated={() => { setAddingToStage(null); load(); }}
                    onCancel={() => setAddingToStage(null)}
                  />
                )}
                {stage.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setOpenTaskId(task.id)}
                    onTogglePriority={() => handleTogglePriority(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="stage-column stage-column--add">
          {isAddStageOpen ? (
            <form onSubmit={handleAddStage}>
              <input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Nom de l'étape"
                autoFocus
                style={{ marginBottom: 8, width: '100%' }}
                className="stage-column__new-input"
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="submit" className="btn btn--primary" style={{ padding: '6px 12px', fontSize: 13 }}>OK</button>
                <button type="button" className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setIsAddStageOpen(false)}>Annuler</button>
              </div>
            </form>
          ) : (
            <button className="stage-column__add-stage-btn" onClick={() => setIsAddStageOpen(true)}>
              + Ajouter une étape
            </button>
          )}
        </div>
      </div>

      {openTaskId && (
        <Dialog title="Détail de la tâche" onClose={() => setOpenTaskId(null)}>
          <TaskFormDialog
            taskId={openTaskId}
            stages={board.stages}
            users={users}
            onClose={() => setOpenTaskId(null)}
            onSaved={() => { setOpenTaskId(null); load(); }}
            onDeleted={() => { setOpenTaskId(null); load(); }}
          />
        </Dialog>
      )}
    </div>
  );
}