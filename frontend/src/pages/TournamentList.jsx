import './TournamentList.css';

function TournamentList() {
  // Příklady turnajů pro demonstraci (budou později nahrazeny daty z databáze)
  const exampleTournaments = [
    {
      id: 1,
      nazev: 'Mistrovství města 2025',
      datum: '2025-12-15',
      misto: 'Sportovní hala Praha',
      typ: 'pavouk',
      status: 'nadchazejici'
    },
    {
      id: 2,
      nazev: 'Vánoční turnaj',
      datum: '2025-12-20',
      misto: 'TJ Sokol Brno',
      typ: 'skupina',
      status: 'nadchazejici'
    },
    {
      id: 3,
      nazev: 'Podzimní pohár',
      datum: '2025-10-10',
      misto: 'SK Ostrava',
      typ: 'smiseny',
      status: 'ukonceny'
    }
  ];

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

      {exampleTournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>Žádné turnaje</h2>
          <p>Zatím jste nevytvořili žádný turnaj</p>
          <a href="/novy-turnaj" className="btn-empty-action">
            Vytvořit první turnaj
          </a>
        </div>
      ) : (
        <div className="tournaments-grid">
          {exampleTournaments.map((tournament) => (
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
              </div>
              
              <div className="tournament-actions">
                <button className="btn-view">Zobrazit</button>
                <button className="btn-edit">Upravit</button>
                <button className="btn-delete">Smazat</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TournamentList;
