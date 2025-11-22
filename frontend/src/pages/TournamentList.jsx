import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TournamentList.css';

function TournamentList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tournaments from backend
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      } else {
        setError('Nepodařilo se načíst turnaje');
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setError('Chyba při spojení se serverem');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Opravdu chcete smazat tento turnaj?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/tournaments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove tournament from state
        setTournaments(tournaments.filter(t => t.id !== id));
        alert('Turnaj byl úspěšně smazán');
      } else {
        alert('Chyba při mazání turnaje');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Chyba při spojení se serverem');
    }
  };

  const getTypLabel = (typ) => {
    const typy = {
      'pavouk': 'Pavouk',
      'skupina': 'Skupinový',
      'smiseny': 'Smíšený'
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
      day: 'numeric' 
    });
  };

  return (
    <div className="tournament-list-container">
      <div className="page-header">
        <h1>Seznam turnajů</h1>
        <p>Přehled všech vytvořených turnajů ve stolním tenisu</p>
      </div>

      <div className="list-actions">
        <a href="/novy-turnaj" className="btn-new-tournament">
          ➕ Vytvořit nový turnaj
        </a>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Načítání turnajů...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={fetchTournaments} className="btn-retry">Zkusit znovu</button>
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>Žádné turnaje</h2>
          <p>Zatím jste nevytvořili žádný turnaj</p>
          <a href="/novy-turnaj" className="btn-empty-action">
            Vytvořit první turnaj
          </a>
        </div>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <div className="tournaments-grid">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-card">
              <div className="tournament-header">
                <h3>{tournament.nazev}</h3>
                <span className={`status-badge status-${tournament.status}`}>
                  {getStatusLabel(tournament.status)}
                </span>
              </div>
              
              <div className="tournament-details">
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <span className="detail-text">{formatDate(tournament.datum)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span className="detail-text">{tournament.misto}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-icon">🏆</span>
                  <span className="detail-text">{getTypLabel(tournament.typ)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">👥</span>
                  <span className="detail-text">{tournament.maxPocetHracu} hráčů</span>
                </div>
              </div>
              
              <div className="tournament-actions">
                <button className="btn-view" onClick={() => navigate(`/turnaje/${tournament.id}`)}>Zobrazit</button>
                <button className="btn-edit">Upravit</button>
                <button className="btn-delete" onClick={() => handleDelete(tournament.id)}>Smazat</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TournamentList;
