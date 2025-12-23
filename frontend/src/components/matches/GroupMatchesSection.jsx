function GroupMatchesSection({
  tournament,
  matches,
  onStartTournament,
  saveMatchResult,
  resetMatchResult,
  handleMatchStateUpdate,
  editingMatchId,
  setEditingMatchId,
  editingScore,
  setEditingScore,
  getMatchesByRound,
  getRoundLabel,
  getStatusLabel,
  getTableOptions
}) {
  const groupMatches = matches.filter(m => m.round < 900);

  const renderMatch = (match) => (
    <div key={match.id} className="match-item">
      <div className="match-meta">
        <div className="match-meta-left">
          <div className="match-number">Zápas {match.groupLetter || '?'}{match.matchNumberInGroup || match.match_number}</div>
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

      {(tournament.status === 'probiha' && match.status !== 'ukonceny' && match.player1_id && match.player2_id) && (
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
        editingMatchId === match.id ? (
          <div className="match-edit">
            <label>Výsledek:&nbsp;</label>
            <select value={editingScore} onChange={(e)=> setEditingScore(e.target.value)}>
              <option value="" disabled>Vyberte</option>
              <option value="3:0">3:0</option>
              <option value="3:1">3:1</option>
              <option value="3:2">3:2</option>
              <option value="2:3">2:3</option>
              <option value="1:3">1:3</option>
              <option value="0:3">0:3</option>
            </select>
            <button className="btn-save" onClick={()=> editingScore && saveMatchResult(match.id, editingScore)}>Uložit</button>
            <button className="btn-secondary" onClick={()=>{ setEditingMatchId(null); setEditingScore(''); }}>Zrušit</button>
            <button className="btn-link" onClick={()=> resetMatchResult(match.id)}>Resetovat</button>
          </div>
        ) : (
          <div className="match-result-row">
            <div className="match-result">Výsledek: {match.player1_score} : {match.player2_score}</div>
            <button className="btn-secondary" onClick={()=>{
              setEditingMatchId(match.id);
              setEditingScore(`${match.player1_score}:${match.player2_score}`);
            }}>Upravit</button>
            <button className="btn-link" onClick={()=> resetMatchResult(match.id)}>Resetovat</button>
          </div>
        )
      ) : null}
    </div>
  );

  return (
    <div className="info-section">
      <h2>Zápasy ve skupinách</h2>
      {tournament.status === 'nadchazejici' && (
        <div style={{marginBottom: '12px'}}>
          <button className="btn-start" onClick={onStartTournament}>🚀 Zahájit turnaj</button>
        </div>
      )}
      {groupMatches.length === 0 ? (
        <div className="empty-players">
          <p>Zatím nejsou k dispozici žádné zápasy ve skupinách</p>
        </div>
      ) : (
        <div className="matches-container">
          {getMatchesByRound(groupMatches).map(({ round, roundMatches }) => (
            <div key={round} className="round-section">
              <h3 className="round-title">{getRoundLabel(round, tournament.typ)}</h3>
              <div className="matches-list">
                {roundMatches.map(renderMatch)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupMatchesSection;
