import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TournamentDetail.css';

function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournament();
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
