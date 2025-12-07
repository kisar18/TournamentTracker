import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TournamentDetail.css';

function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchTournament();
    fetchPlayers();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/tournaments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data);
      } else {
        setError('Turnaj nebyl nalezen');
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Chyba při načítání turnaje');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/tournaments/${id}/players`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    
    if (!newPlayerName.trim()) {
      setNotification({ message: 'Prosím zadejte jméno hráče', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/tournaments/${id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jmeno: newPlayerName })
      });

      if (response.ok) {
        const newPlayer = await response.json();
        setPlayers([...players, newPlayer]);
        setNewPlayerName('');
        setNotification({ message: 'Hráč byl úspěšně přidán', type: 'success' });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
      } else {
        const error = await response.json();
        setNotification({ message: error.error || 'Chyba při přidávání hráče', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding player:', error);
      setNotification({ message: 'Chyba při spojení se serverem', type: 'error' });
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Opravdu chcete odstranit tohoto hráče?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/players/${playerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPlayers(players.filter(p => p.id !== playerId));
        setNotification({ message: 'Hráč byl úspěšně odstraněn', type: 'success' });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
      } else {
        setNotification({ message: 'Chyba při mazání hráče', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      setNotification({ message: 'Chyba při spojení se serverem', type: 'error' });
    }
  };

  const getTypLabel = (typ) => {
    const typy = {
      'pavouk': 'Pavouk (Vyřazovací systém)',
      'skupina': 'Skupinový systém',
      'smiseny': 'Smíšený (Skupiny + Pavouk)'
    };
    return typy[typ] || typ;
  };

  const getStatusLabel = (status) => {
    const statusy = {
      'nadchazejici': 'Nadcházející',
      'probiha': 'Probíhá',
      'ukonceny': 'Ukončený'
    };
    return statusy[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="tournament-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Načítání turnaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-detail-container">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={() => navigate('/turnaje')} className="btn-back">
            Zpět na seznam
          </button>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  return (
    <div className="tournament-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/turnaje')} className="btn-back-arrow">
          ← Zpět na seznam
        </button>
        <div className="header-content">
          <h1>{tournament.nazev}</h1>
          <span className={`status-badge status-${tournament.status}`}>
            {getStatusLabel(tournament.status)}
          </span>
        </div>
      </div>

      <div className="detail-content">
        {notification.message && (
          <div className={`notification notification-${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close" 
              onClick={() => setNotification({ message: '', type: '' })}
            >
              ✕
            </button>
          </div>
        )}
        <div className="info-section">
          <h2>Základní informace</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">🏆</div>
              <div className="info-details">
                <div className="info-label">Typ turnaje</div>
                <div className="info-value">{getTypLabel(tournament.typ)}</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">📅</div>
              <div className="info-details">
                <div className="info-label">Datum konání</div>
                <div className="info-value">{formatDate(tournament.datum)}</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">📍</div>
              <div className="info-details">
                <div className="info-label">Místo konání</div>
                <div className="info-value">{tournament.misto}</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">👥</div>
              <div className="info-details">
                <div className="info-label">Maximální počet hráčů</div>
                <div className="info-value">{tournament.maxPocetHracu} hráčů</div>
              </div>
            </div>
          </div>
        </div>

        {tournament.popis && (
          <div className="info-section">
            <h2>Popis turnaje</h2>
            <div className="description-box">
              <p>{tournament.popis}</p>
            </div>
          </div>
        )}

        <div className="info-section">
          <div className="section-header">
            <h2>Hráči ({players.length}/{tournament.maxPocetHracu})</h2>
          </div>
          
          <form onSubmit={handleAddPlayer} className="add-player-form">
            <div className="form-group-inline">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Zadejte jméno hráče"
                className="player-input"
              />
              <button 
                type="submit" 
                className="btn-add-player"
                disabled={players.length >= tournament.maxPocetHracu}
              >
                + Přidat hráče
              </button>
            </div>
          </form>

          {players.length === 0 ? (
            <div className="empty-players">
              <p>Zatím nejsou přidáni žádní hráči</p>
            </div>
          ) : (
            <div className="players-list">
              {players.map((player, index) => (
                <div key={player.id} className="player-item">
                  <span className="player-number">{index + 1}</span>
                  <span className="player-name">{player.jmeno}</span>
                  <button
                    className="btn-remove-player"
                    onClick={() => handleDeletePlayer(player.id)}
                    title="Odstranit hráče"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info-section">
          <h2>Metadata</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">ID turnaje:</span>
              <span className="metadata-value">{tournament.id}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Vytvořeno:</span>
              <span className="metadata-value">
                {tournament.created_at ? new Date(tournament.created_at).toLocaleString('cs-CZ') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-edit" onClick={() => alert('Funkce editace bude přidána později')}>
            ✏️ Upravit turnaj
          </button>
          <button className="btn-delete" onClick={() => {
            if (window.confirm('Opravdu chcete smazat tento turnaj?')) {
              fetch(`http://localhost:3000/api/tournaments/${id}`, { method: 'DELETE' })
                .then(() => navigate('/turnaje'))
                .catch(err => alert('Chyba při mazání'));
            }
          }}>
            🗑️ Smazat turnaj
          </button>
        </div>
      </div>
    </div>
  );
}

export default TournamentDetail;
