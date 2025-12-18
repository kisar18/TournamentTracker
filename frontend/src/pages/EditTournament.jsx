import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './NewTournament.css';

function EditTournament() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nazev: '',
    typ: 'pavouk',
    maxPocetHracu: '',
    datum: '',
    misto: '',
    popis: '',
    pocetStolu: '1',
    status: 'nadchazejici'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`http://localhost:3000/api/tournaments/${id}`);
        if (!resp.ok) throw new Error('Turnaj nenalezen');
        const data = await resp.json();
        setFormData({
          nazev: data.nazev || '',
          typ: data.typ || 'pavouk',
          maxPocetHracu: data.maxPocetHracu?.toString() || '',
          datum: data.datum || '',
          misto: data.misto || '',
          popis: data.popis || '',
          pocetStolu: (data.pocetStolu || 1).toString(),
          status: data.status || 'nadchazejici'
        });
      } catch (e) {
        setNotification({ message: 'Nepodařilo se načíst turnaj', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'nazev' || name === 'misto' || name === 'popis') && value.length > 0) {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData(prev => ({ ...prev, [name]: capitalizedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const missing = [];
    if (!formData.nazev.trim()) missing.push('Název');
    if (!formData.typ) missing.push('Typ');
    if (!formData.maxPocetHracu) missing.push('Počet hráčů');
    if (!formData.datum) missing.push('Datum');
    if (!formData.misto.trim()) missing.push('Místo');
    if (!formData.pocetStolu) missing.push('Počet stolů');
    if (missing.length) {
      setNotification({ message: `Chybí: ${missing.join(', ')}`, type: 'error' });
      return false;
    }
    const stolCount = parseInt(formData.pocetStolu, 10);
    if (Number.isNaN(stolCount) || stolCount < 1) {
      setNotification({ message: 'Počet stolů musí být alespoň 1', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setNotification({ message: '', type: '' });
    try {
      const resp = await fetch(`http://localhost:3000/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxPocetHracu: parseInt(formData.maxPocetHracu, 10),
          pocetStolu: parseInt(formData.pocetStolu, 10)
        })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Chyba při ukládání');
      }
      setNotification({ message: 'Turnaj byl upraven', type: 'success' });
      setTimeout(() => navigate(`/turnaje/${id}`), 800);
    } catch (err) {
      setNotification({ message: err.message || 'Chyba při ukládání', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="new-tournament-container">
        <div className="page-header"><h1>Načítání...</h1></div>
      </div>
    );
  }

  const isLocked = formData.status !== 'nadchazejici';

  return (
    <div className="new-tournament-container">
      <div className="page-header">
        <h1>Upravit turnaj</h1>
        <p>{formData.nazev}</p>
      </div>

      <form onSubmit={handleSubmit} className="tournament-form" onKeyPress={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit(e);
        }
      }}>
        <div className="step-content">
          <h2>Základní údaje</h2>
          <div className="form-group">
            <label htmlFor="nazev">Název turnaje *</label>
            <input id="nazev" name="nazev" value={formData.nazev} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label>Typ turnaje *</label>
            <div className="type-options">
              {['pavouk','skupina','smiseny'].map(val => (
                <label key={val} className={`type-card ${formData.typ === val ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="typ"
                    value={val}
                    checked={formData.typ === val}
                    onChange={handleChange}
                    disabled={saving || isLocked}
                  />
                  <div className="type-icon">{val === 'pavouk' ? '🏆' : val === 'skupina' ? '👥' : '🔀'}</div>
                  <div className="type-title">{val === 'pavouk' ? 'Pavouk' : val === 'skupina' ? 'Skupinový' : 'Smíšený'}</div>
                </label>
              ))}
            </div>
            {isLocked && <small>Typ nelze změnit po zahájení.</small>}
          </div>

          <div className="form-group">
            <label htmlFor="maxPocetHracu">Maximální počet hráčů *</label>
            <input
              type="number"
              id="maxPocetHracu"
              name="maxPocetHracu"
              value={formData.maxPocetHracu}
              onChange={handleChange}
              min="2"
              disabled={saving || isLocked}
            />
          </div>

          <div className="form-group">
            <label htmlFor="datum">Datum konání *</label>
            <input type="date" id="datum" name="datum" value={formData.datum} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label htmlFor="misto">Místo konání *</label>
            <input id="misto" name="misto" value={formData.misto} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label htmlFor="pocetStolu">Počet stolů *</label>
            <input
              type="number"
              id="pocetStolu"
              name="pocetStolu"
              value={formData.pocetStolu}
              onChange={handleChange}
              min="1"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="popis">Popis</label>
            <textarea id="popis" name="popis" rows="4" value={formData.popis} onChange={handleChange} disabled={saving} />
          </div>
        </div>

        {notification.message && (
          <div className={`notification notification-${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button className="notification-close" onClick={() => setNotification({ message: '', type: '' })}>✕</button>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/turnaje/${id}`)} disabled={saving}>← Zpět</button>
          <button type="submit" className="btn-primary" disabled={saving}>Uložit změny</button>
        </div>
      </form>
    </div>
  );
}

export default EditTournament;
