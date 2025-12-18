import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import NewTournament from './pages/NewTournament';
import TournamentList from './pages/TournamentList';
import TournamentDetail from './pages/TournamentDetail';
import EditTournament from './pages/EditTournament';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/novy-turnaj" element={<NewTournament />} />
            <Route path="/turnaje" element={<TournamentList />} />
            <Route path="/turnaje/:id/upravit" element={<EditTournament />} />
            <Route path="/turnaje/:id" element={<TournamentDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
