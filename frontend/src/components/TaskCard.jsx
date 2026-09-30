export default function TaskCard({ task, onClick, onTogglePriority }) {
  const initial = task.user_id ? task.user_id[1].charAt(0).toUpperCase() : '?';

  return (
    <div className="task-card" onClick={onClick}>
      <p className="task-card__title">{task.name}</p>
      <div className="task-card__footer">
        <button
          className={`task-card__star ${task.priority === '1' ? 'task-card__star--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePriority();
          }}
          aria-label="Basculer la priorité"
          title="Priorité"
        >
          ★
        </button>
        {task.date_deadline && <span className="task-card__deadline">📅 {task.date_deadline}</span>}
        <span className="task-card__avatar" title={task.user_id ? task.user_id[1] : 'Non assigné'}>
          {initial}
        </span>
      </div>
    </div>
  );
}