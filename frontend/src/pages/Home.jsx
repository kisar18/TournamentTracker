import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Vítejte ve Správci Turnajů Stolního Tenisu</h1>
        <p className="hero-description">
          Profesionální nástroj pro organizaci a sledování turnajů ve stolním tenisu
        </p>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Vytvářejte turnaje</h3>
          <p>Snadno vytvářejte a konfigurujte nové turnaje s vlastními pravidly a formátem</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Sledujte výsledky</h3>
          <p>Zaznamenávejte a sledujte průběh všech vašich turnajů na jednom místě</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Správa hráčů</h3>
          <p>Organizujte hráče a týmy efektivně a přehledně</p>
        </div>
      </div>

      <div className="cta-section">
        <h2>Připraveni začít?</h2>
        <p>Vytvořte svůj první turnaj ještě dnes</p>
        <a href="/novy-turnaj" className="cta-button">
          Vytvořit nový turnaj
        </a>
      </div>
    </div>
  );
}

export default Home;
