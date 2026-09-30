import { useEffect, useState } from 'react';

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString.replace(' ', 'T')).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Chatter({ getMessages, postMessage, itemId }) {
  const [messages, setMessages] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    getMessages(itemId)
      .then(setMessages)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  async function handlePostNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await postMessage(itemId, noteText);
      setNoteText('');
      load();
    } catch (err) {
      alert(`Impossible d'ajouter la note : ${err.message}`);
    }
  }

  return (
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
        {isLoading && <p className="state-message">Chargement…</p>}
        {!isLoading && messages.length === 0 && <p className="state-message">Aucune activité pour l'instant.</p>}
        {messages.map((m) => (
          <div key={m.id} className="task-chatter__item">
            <div className="task-chatter__avatar">{m.author.charAt(0).toUpperCase()}</div>
            <div>
              <p className="task-chatter__meta">
                <strong>{m.author}</strong> — {formatDate(m.date)}
              </p>
              {m.body && <p className="task-chatter__body">{m.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}