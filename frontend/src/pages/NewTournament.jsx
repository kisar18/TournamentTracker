import { useState } from 'react';
import './NewTournament.css';

function NewTournament() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nazev: '',
    typ: 'pavouk',
    datum: '',
    misto: '',
    popis: '',
    pocetStolu: '1'
  });
  const [notification, setNotification] = useState({ message: '', type: '' }); // 'success', 'error', 'warning'

  const totalSteps = 3;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Capitalize first letter of tournament name, place, and description
    if ((name === 'nazev' || name === 'misto' || name === 'popis') && value.length > 0) {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData(prev => ({
        ...prev,
        [name]: capitalizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNextClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    nextStep();
  };

  const goToStep = (stepNumber) => {
    // Only allow going back to previous steps, not forward
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only validate and submit if we're on the last step
    if (currentStep !== totalSteps) {
      return;
    }
    
    // Clear previous notifications
    setNotification({ message: '', type: '' });
    
    // Validate required fields before submitting
    const missingFields = [];
    if (!formData.nazev || formData.nazev.trim() === '') missingFields.push('Název turnaje');
    if (!formData.typ) missingFields.push('Typ turnaje');
    if (!formData.datum) missingFields.push('Datum konání');
    if (!formData.misto || formData.misto.trim() === '') missingFields.push('Místo konání');
    if (!formData.pocetStolu) missingFields.push('Počet stolů');
    
    if (missingFields.length > 0) {
      setNotification({
        message: `Prosím vyplňte následující povinná pole:\n${missingFields.join(', ')}`,
        type: 'error'
      });
      return;
    }

    const stolCount = parseInt(formData.pocetStolu);
    if (Number.isNaN(stolCount) || stolCount < 1) {
      setNotification({
        message: 'Počet stolů musí být alespoň 1',
        type: 'error'
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newTournament = await response.json();
        setNotification({
          message: 'Turnaj byl úspěšně vytvořen! Přesměrování...',
          type: 'success'
        });
        // Redirect to tournaments list after a short delay
        setTimeout(() => {
          window.location.href = '/turnaje';
        }, 1500);
      } else {
        const error = await response.json();
        setNotification({
          message: `Chyba: ${error.error || 'Nepodařilo se vytvořit turnaj'}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      setNotification({
        message: 'Chyba při spojení se serverem. Ujistěte se, že backend server běží.',
        type: 'error'
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.nazev.trim() !== '';
      case 2:
        return formData.typ !== '';
      case 3:
        // Step 4 doesn't need validation for "Next" since it's the last step
        // Validation will happen on form submit
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="new-tournament-container">
      <div className="page-header">
        <h1>Vytvořit nový turnaj</h1>
        <p>Krok {currentStep} z {totalSteps}</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="progress-steps">
          <div 
            className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={() => goToStep(1)}
            style={{ cursor: currentStep >= 1 ? 'pointer' : 'default' }}
          >
            <div className="step-number">1</div>
            <div className="step-label">Název</div>
          </div>
          <div 
            className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={() => goToStep(2)}
            style={{ cursor: currentStep >= 2 ? 'pointer' : 'default' }}
          >
            <div className="step-number">2</div>
            <div className="step-label">Typ</div>
          </div>
          <div 
            className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
            onClick={() => goToStep(3)}
            style={{ cursor: currentStep >= 3 ? 'pointer' : 'default' }}
          >
            <div className="step-number">3</div>
            <div className="step-label">Detaily</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tournament-form" onKeyPress={(e) => {
        if (e.key === 'Enter' && currentStep < totalSteps) {
          e.preventDefault();
          if (canProceed()) {
            nextStep();
          }
        }
      }}>
        {/* Step 1: Tournament Name */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Název turnaje</h2>
            <p className="step-description">Zadejte název vašeho turnaje</p>
            <div className="form-group">
              <label htmlFor="nazev">Název turnaje *</label>
              <input
                type="text"
                id="nazev"
                name="nazev"
                value={formData.nazev}
                onChange={handleChange}
                placeholder="např. Mistrovství města 2025"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Tournament Type */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>Typ turnaje</h2>
            <p className="step-description">Vyberte formát turnaje</p>
            <div className="form-group">
              <div className="type-options">
                <label className={`type-card ${formData.typ === 'pavouk' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="typ"
                    value="pavouk"
                    checked={formData.typ === 'pavouk'}
                    onChange={handleChange}
                  />
                  <div className="type-icon">🏆</div>
                  <div className="type-title">Pavouk</div>
                  <div className="type-desc">Klasický vyřazovací systém</div>
                </label>

                <label className={`type-card ${formData.typ === 'skupina' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="typ"
                    value="skupina"
                    checked={formData.typ === 'skupina'}
                    onChange={handleChange}
                  />
                  <div className="type-icon">👥</div>
                  <div className="type-title">Skupinový</div>
                  <div className="type-desc">Každý hraje s každým</div>
                </label>

                <label className={`type-card ${formData.typ === 'smiseny' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="typ"
                    value="smiseny"
                    checked={formData.typ === 'smiseny'}
                    onChange={handleChange}
                  />
                  <div className="type-icon">🔀</div>
                  <div className="type-title">Smíšený</div>
                  <div className="type-desc">Skupiny následované pavoukem</div>
                </label>
              </div>
            </div>

            {/* Rozpis zápasů byl odstraněn – vždy se používají Bergerovy tabulky */}
          </div>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>Další informace</h2>
            <p className="step-description">Doplňte detaily o turnaji</p>
            
            <div className="form-group">
              <label htmlFor="datum">Datum konání *</label>
              <input
                type="date"
                id="datum"
                name="datum"
                value={formData.datum}
                onChange={handleChange}
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="pocetStolu">Počet stolů *</label>
              <input
                type="number"
                id="pocetStolu"
                name="pocetStolu"
                value={formData.pocetStolu}
                onChange={handleChange}
                placeholder="např. 4"
                min="1"
              />
              <small>Zadejte kolik stolů bude k dispozici</small>
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
          </div>
        )}

        {/* Notification Message */}
        {notification.message && (
          <div className={`notification notification-${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
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

        {/* Navigation Buttons */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            ← Zpět
          </button>

          {currentStep < totalSteps ? (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleNextClick}
              disabled={!canProceed()}
            >
              Další →
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn-primary"
            >
              Vytvořit turnaj
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default NewTournament;
