import { useEffect, useState } from 'react';
import {
  getTaskDetail, updateTask, deleteTask, duplicateTask,
  toggleTaskPriority, getTaskMessages, postTaskMessage,
} from '../api/projects';
import useClickOutside from '../hooks/useClickOutside';

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString.replace(' ', 'T')).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TaskFormDialog({ taskId, stages, users, onClose, onSaved, onDeleted }) {
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const menuRef = useClickOutside(() => setIsActionMenuOpen(false));

  function loadAll() {
    setIsLoading(true);
    setError(null);
    Promise.all([getTaskDetail(taskId), getTaskMessages(taskId)])
      .then(([taskData, messagesData]) => {
        setTask(taskData);
        setMessages(messagesData);
        setForm({
          name: taskData.name || '',
          description: taskData.description ? taskData.description.replace(/<[^>]*>/g, '') : '',
          userId: taskData.user_id ? String(taskData.user_id[0]) : '',
          stageId: taskData.stage_id ? String(taskData.stage_id[0]) : '',
          dateDeadline: taskData.date_deadline || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function handleTogglePriority() {
    await toggleTaskPriority(taskId);
    loadAll();
  }

  async function handleStageClick(stageId) {
    if (task.stage_id && task.stage_id[0] === stageId) return;
    await updateTask(taskId, { ...form, stageId: String(stageId) });
    loadAll();
    onSaved();
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Le titre est obligatoire.');

    setIsSaving(true);
    try {
      await updateTask(taskId, form);
      setIsEditing(false);
      loadAll();
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsActionMenuOpen(false);
    if (!window.confirm('Supprimer définitivement cette tâche ?')) return;
    try {
      await deleteTask(taskId);
      onDeleted();
    } catch (err) {
      alert(`Impossible de supprimer : ${err.message}`);
    }
  }

  async function handleDuplicate() {
    setIsActionMenuOpen(false);
    try {
      await duplicateTask(taskId);
      alert('Tâche dupliquée avec succès.');
      onSaved();
    } catch (err) {
      alert(`Impossible de dupliquer : ${err.message}`);
    }
  }

  async function handlePostNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await postTaskMessage(taskId, noteText);
      setNoteText('');
      loadAll();
    } catch (err) {
      alert(`Impossible d'ajouter la note : ${err.message}`);
    }
  }

  if (isLoading) return <p className="state-message">Chargement…</p>;
  if (error && !task) return <p className="state-message state-message--error">{error}</p>;
  if (!task) return null;

  if (isEditing) {
    return (
      <form onSubmit={handleSaveEdit}>
        <div className="client-form__grid">
          <label className="field field--wide">
            <span className="field__label">Titre de la tâche</span>
            <input name="name" value={form.name} onChange={handleFormChange} autoComplete="off" />
          </label>
          <label className="field">
            <span className="field__label">Assigné à</span>
            <select name="userId" value={form.userId} onChange={handleFormChange}>
              <option value="">— Non assigné —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Étape</span>
            <select name="stageId" value={form.stageId} onChange={handleFormChange}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Date limite</span>
            <input name="dateDeadline" type="date" value={form.dateDeadline} onChange={handleFormChange} />
          </label>
        </div>

        <label className="field" style={{ marginBottom: 20 }}>
          <span className="field__label">Description</span>
          <textarea name="description" value={form.description} onChange={handleFormChange} rows={4} className="textarea-field" />
        </label>

        {error && <p className="client-form__error">{error}</p>}

        <div className="client-form__actions">
          <button type="submit" className="btn btn--primary" disabled={isSaving}>
            {isSaving ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setIsEditing(false)}>Annuler</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="purchase-toolbar" style={{ marginBottom: 12 }}>
        <div className="purchase-toolbar__group">
          <button className="btn btn--soft" onClick={() => setIsEditing(true)}>Modifier</button>
        </div>
        <div className="purchase-toolbar__menu" ref={menuRef}>
          <button className="btn btn--ghost" onClick={() => setIsActionMenuOpen((v) => !v)}>Action ▾</button>
          {isActionMenuOpen && (
            <div className="dropdown-menu">
              <button onClick={handleDelete} className="dropdown-menu__danger">Supprimer</button>
              <button onClick={handleDuplicate}>Dupliquer</button>
            </div>
          )}
        </div>
      </div>

      <div className="task-stage-breadcrumb">
        {stages.map((s) => (
          <button
            key={s.id}
            className={`task-stage-breadcrumb__step ${task.stage_id && task.stage_id[0] === s.id ? 'task-stage-breadcrumb__step--active' : ''}`}
            onClick={() => handleStageClick(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="task-detail-title">
        <button
          className={`task-card__star ${task.priority === '1' ? 'task-card__star--active' : ''}`}
          onClick={handleTogglePriority}
          style={{ fontSize: 22 }}
        >
          ★
        </button>
        <h2 style={{ margin: 0 }}>{task.name}</h2>
      </div>

      <div className="purchase-info-grid" style={{ marginTop: 20, marginBottom: 20 }}>
        <div>
          <p className="field__label">Projet</p>
          <p>{task.project_id ? task.project_id[1] : '—'}</p>
        </div>
        <div>
          <p className="field__label">Assigné à</p>
          <p>{task.user_id ? task.user_id[1] : 'Non assigné'}</p>
        </div>
        <div>
          <p className="field__label">Date limite</p>
          <p>{task.date_deadline || '—'}</p>
        </div>
      </div>

      {task.description && (
        <>
          <p className="field__label">Description</p>
          <p style={{ marginBottom: 20 }}>{task.description.replace(/<[^>]*>/g, '')}</p>
        </>
      )}

      <div className="task-chatter">
        <form onSubmit={handlePostNote} className="task-chatter__form">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enregistrer une note…"
          />
          <button type="submit" className="btn btn--ghost" style={{ fontSize: 13 }}>Envoyer</button>
        </form>

        <div className="task-chatter__log">
          {messages.length === 0 && <p className="state-message">Aucune activité pour l'instant.</p>}
          {messages.map((m) => (
            <div key={m.id} className="task-chatter__item">
              <div className="task-chatter__avatar">{m.author.charAt(0).toUpperCase()}</div>
              <div>
                <p className="task-chatter__meta">
                  <strong>{m.author}</strong> — {formatDate(m.date)}
                </p>
                {m.body && <p className="task-chatter__body">{m.body}</p>}
                {m.changes.length > 0 && (
                  <ul className="task-chatter__changes">
                    {m.changes.map((c, i) => (
                      <li key={i}>
                        {c.field_desc}: {c.old_value_char || '—'} → {c.new_value_char || '—'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}