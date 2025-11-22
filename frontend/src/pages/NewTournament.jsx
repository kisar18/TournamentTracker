import { useState } from 'react';
import './NewTournament.css';

function NewTournament() {
  const [formData, setFormData] = useState({
    nazev: '',
    datum: '',
    misto: '',
    typ: 'pavouk',
    maxPocetHracu: '',
    popis: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logika pro uložení bude přidána později
    console.log('Data turnaje:', formData);
    alert('Turnaj bude vytvořen (funkce bude implementována později)');
  };

  return (
    <div className="new-tournament-container">
      <div className="page-header">
        <h1>Vytvořit nový turnaj</h1>
        <p>Vyplňte informace o vašem novém turnaji ve stolním tenisu</p>
      </div>

      <form onSubmit={handleSubmit} className="tournament-form">
        <div className="form-group">
          <label htmlFor="nazev">Název turnaje *</label>
          <input
            type="text"
            id="nazev"
            name="nazev"
            value={formData.nazev}
            onChange={handleChange}
            placeholder="např. Mistrovství města 2025"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="datum">Datum konání *</label>
            <input
              type="date"
              id="datum"
              name="datum"
              value={formData.datum}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="misto">Místo konání *</label>
            <input
              type="text"
              id="misto"
              name="misto"
              value={formData.misto}
              onChange={handleChange}
              placeholder="např. Sportovní hala Praha"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="typ">Typ turnaje *</label>
            <select
              id="typ"
              name="typ"
              value={formData.typ}
              onChange={handleChange}
              required
            >
              <option value="pavouk">Pavouk (Eliminace)</option>
              <option value="skupina">Skupinový systém</option>
              <option value="smiseny">Smíšený (Skupiny + Pavouk)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="maxPocetHracu">Maximální počet hráčů</label>
            <input
              type="number"
              id="maxPocetHracu"
              name="maxPocetHracu"
              value={formData.maxPocetHracu}
              onChange={handleChange}
              placeholder="např. 16"
              min="2"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="popis">Popis turnaje</label>
          <textarea
            id="popis"
            name="popis"
            value={formData.popis}
            onChange={handleChange}
            placeholder="Zadejte podrobnosti o turnaji, pravidla, ceny apod."
            rows="5"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Vytvořit turnaj
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.history.back()}>
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewTournament;
