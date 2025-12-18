import express from 'express';
import cors from 'cors';
import { initDB } from './database.js';
import tournamentRoutes from './routes/tournaments.js';
import playerRoutes from './routes/players.js';
import matchRoutes from './routes/matches.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDB();

// API Routes
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server běží' });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server běží na http://localhost:${PORT}`);
  console.log(` API endpoint: http://localhost:${PORT}/api/tournaments`);
});
