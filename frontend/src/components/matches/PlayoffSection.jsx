function PlayoffSection({
  tournament,
  matches,
  id,
  fetchMatches,
  setNotification,
  saveMatchResult,
  resetMatchResult,
  handleMatchStateUpdate,
  getTableOptions,
  getPlayoffRoundName,
  getStatusLabel,
  editingMatchId,
  setEditingMatchId,
  editingScore,
  setEditingScore
}) {
  const playoffs = matches.filter(m => m.round >= 900);
  const groupMatches = matches.filter(m => m.round < 900);
  const anyUnfinishedGroups = groupMatches.some(m => m.status !== 'ukonceny');
  const canGenerate = playoffs.length === 0 && !anyUnfinishedGroups && tournament.status === 'probiha';
  const canReset = playoffs.length > 0 && tournament.status === 'probiha';

  const computeNextRoundFlag = () => {
    if (playoffs.length === 0) return { canGenerateNextRound: false, currentPlayoffRound: null };
    const rounds = [...new Set(playoffs.map(m => m.round))].sort((a,b) => b - a);
    const currentPlayoffRound = rounds[0];
    const currentRoundMatches = playoffs.filter(m => m.round === currentPlayoffRound);
    const allFinished = currentRoundMatches.every(m => m.status === 'ukonceny');
    const winners = currentRoundMatches.filter(m => m.winner_id !== null && m.winner_id !== undefined);
    const hasMultipleWinners = winners.length >= 2;
    const nextRoundExists = playoffs.some(m => m.round === currentPlayoffRound + 1);
    return {
      canGenerateNextRound: allFinished && hasMultipleWinners && !nextRoundExists && tournament.status === 'probiha',
      currentPlayoffRound
    };
  };

  const { canGenerateNextRound } = computeNextRoundFlag();

  const handleGeneratePlayoff = async () => {
    try {
      const resp = await fetch(`http://localhost:3000/api/tournaments/${id}/playoffs`, { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        setNotification({ message: `Play-off vygenerováno (${data.matchesCreated} zápasů)`, type: 'success' });
        await fetchMatches();
      } else {
        const err = await resp.json();
        setNotification({ message: err.error || 'Chyba při generování play-off', type: 'error' });
      }
    } catch (e) {
      setNotification({ message: 'Chyba při spojení se serverem', type: 'error' });
    }
  };

  const handleGenerateNextRound = async () => {
    try {
      const resp = await fetch(`http://localhost:3000/api/tournaments/${id}/playoffs/next-round`, { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        setNotification({ message: `Další kolo play-off vygenerováno (${data.matchesCreated} zápasů)`, type: 'success' });
        await fetchMatches();
      } else {
        const err = await resp.json();
        setNotification({ message: err.error || 'Chyba při generování dalšího kola', type: 'error' });
      }
    } catch (e) {
      setNotification({ message: 'Chyba při spojení se serverem', type: 'error' });
    }
  };

  const handleResetPlayoff = async () => {
    if (!window.confirm('Opravdu chcete resetovat play-off? Všechny zápasy a výsledky play-off budou smazány.')) return;
    try {
      const resp = await fetch(`http://localhost:3000/api/tournaments/${id}/playoffs`, { method: 'DELETE' });
      if (resp.ok) {
        const data = await resp.json();
        setNotification({ message: `Play-off resetován (${data.deletedMatches} zápasů smazáno)`, type: 'success' });
        await fetchMatches();
      } else {
        const err = await resp.json();
        setNotification({ message: err.error || 'Chyba při resetování play-off', type: 'error' });
      }
    } catch (e) {
      setNotification({ message: 'Chyba při spojení se serverem', type: 'error' });
    }
  };

  const renderMatch = (match) => (
    <div key={match.id} className="match-item">
      <div className="match-meta">
        <div className="match-meta-left">
          <div className="match-number">Zápas {match.match_number}</div>
          <span className="match-playoff-badge">Play-off</span>
        </div>
        <div className="match-badges">
          <span className={`status-chip status-${match.status || 'nehrany'}`}>
            {getStatusLabel(match.status || 'nehrany')}
          </span>
          {match.table_number && <span className="table-chip">Stůl {match.table_number}</span>}
        </div>
      </div>

      <div className="match-players">
        <div className="match-player">{match.player1_name || 'Volný los'}</div>
        <div className="match-vs">vs</div>
        <div className="match-player">{match.player2_name || 'Volný los'}</div>
      </div>

      {tournament.status === 'probiha' && match.status !== 'ukonceny' && match.player1_id && match.player2_id && (
        <div className="match-actions">
          <div className="match-controls">
            <div className="table-select">
              <label>Stůl:</label>
              <select
                value={match.table_number || ''}
                onChange={(e)=> handleMatchStateUpdate(
                  match.id,
                  { table_number: e.target.value ? parseInt(e.target.value, 10) : null },
                  'Stůl byl aktualizován'
                )}
              >
                <option value="">Nepřiřazeno</option>
                {getTableOptions().map(num => (
                  <option key={num} value={num}>Stůl {num}</option>
                ))}
              </select>
            </div>
            {match.status !== 'probiha' && (
              <button
                type="button"
                className="btn-chip"
                onClick={() => handleMatchStateUpdate(match.id, { status: 'probiha' }, 'Zápas označen jako probíhající')}
              >
                Označit jako probíhá
              </button>
            )}
            {match.status === 'probiha' && <span className="status-hint">Probíhá…</span>}
          </div>
          <div className="match-edit">
            <label>Výsledek:&nbsp;</label>
            <select defaultValue="" onChange={(e)=>{ if(e.target.value) saveMatchResult(match.id, e.target.value); }}>
              <option value="" disabled>Vyberte</option>
              <option value="3:0">3:0</option>
              <option value="3:1">3:1</option>
              <option value="3:2">3:2</option>
              <option value="2:3">2:3</option>
              <option value="1:3">1:3</option>
              <option value="0:3">0:3</option>
            </select>
          </div>
        </div>
      )}

      {match.status === 'ukonceny' ? (
        <div className="match-result-row">
          <div className="match-result">Výsledek: {match.player1_score} : {match.player2_score}</div>
          <button className="btn-secondary" onClick={()=>{
            setEditingMatchId(match.id);
            setEditingScore(`${match.player1_score}:${match.player2_score}`);
          }}>Upravit</button>
          <button className="btn-link" onClick={()=> resetMatchResult(match.id)}>Resetovat</button>
        </div>
      ) : null}
    </div>
  );

  const renderPlayoffRounds = () => {
    if (playoffs.length === 0) return null;
    const playoffRounds = new Map();
    playoffs.forEach(m => {
      if (!playoffRounds.has(m.round)) playoffRounds.set(m.round, []);
      playoffRounds.get(m.round).push(m);
    });

    return Array.from(playoffRounds.entries())
      .sort((a,b) => a[0] - b[0])
      .map(([round, roundMatches]) => {
        const stageName = getPlayoffRoundName(1, roundMatches.length);
        return (
          <div key={round} className="round-section">
            <h3 className="round-title">{stageName}</h3>
            <div className="matches-list">
              {roundMatches.map(renderMatch)}
            </div>
          </div>
        );
      });
  };

  return (
    <div className="info-section">
      <h2>Play-off</h2>
      {canGenerate && (
        <div style={{marginBottom:'12px'}}>
          <button className="btn-start" onClick={handleGeneratePlayoff}>Vygenerovat play-off</button>
        </div>
      )}
      {canGenerateNextRound && (
        <div style={{marginBottom:'12px'}}>
          <button className="btn-start" onClick={handleGenerateNextRound}>Vygenerovat další kolo</button>
        </div>
      )}
      {canReset && (
        <div style={{marginBottom:'12px'}}>
          <button className="btn-delete" onClick={handleResetPlayoff}>Resetovat play-off</button>
        </div>
      )}

      {playoffs.length === 0 ? (
        <div className="empty-players"><p>Zatím nejsou k dispozici žádné zápasy play-off</p></div>
      ) : (
        <div className="matches-container">{renderPlayoffRounds()}</div>
      )}
    </div>
  );
}

export default PlayoffSection;
