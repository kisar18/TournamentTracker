import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🏓 Správce Turnajů
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Domů
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/novy-turnaj" className="nav-link">
              Nový turnaj
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/turnaje" className="nav-link">
              Seznam turnajů
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
