# Tournament Tracker

Webová aplikace pro správu a sledování turnajů ve stolním tenisu.

## Struktura projektu

- `frontend/` - React frontend aplikace
- `backend/` - Node.js/Express backend server s SQLite databází

## Instalace a spuštění

### Backend

```bash
cd backend
npm install
node server.js
```

Backend běží na `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend běží na `http://localhost:5173`

## Technologie

### Frontend
- React 19
- Vite
- React Router

### Backend
- Node.js
- Express
- SQLite (sql.js)
- CORS

## API Endpoints

- `GET /api/tournaments` - Získat všechny turnaje
- `GET /api/tournaments/:id` - Získat konkrétní turnaj
- `POST /api/tournaments` - Vytvořit nový turnaj
- `PUT /api/tournaments/:id` - Aktualizovat turnaj
- `DELETE /api/tournaments/:id` - Smazat turnaj

## Funkce

- ✅ Vytváření nových turnajů (multi-step formulář)
- ✅ Zobrazení seznamu turnajů
- ✅ Mazání turnajů
- ✅ Perzistence dat v SQLite databázi
