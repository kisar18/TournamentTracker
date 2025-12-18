# Tournament Tracker - Copilot Instructions

## Project Overview
Tournament Tracker is a web application for creating and managing table tennis tournaments. The application is fully in Czech language and consists of a React frontend and Node.js/Express backend with SQLite database.

## Technology Stack

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router v6
- **Styling**: Plain CSS with custom components
- **Language**: Czech (UI completely in Czech)
- **Port**: http://localhost:5173

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express
- **Database**: SQLite (using sql.js)
- **CORS**: Enabled for frontend communication
- **Port**: http://localhost:3000

## Project Structure

```
TournamentTracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top navigation menu
│   │   │   └── Navbar.css
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top navigation menu
│   │   │   ├── Navbar.css
│   │   │   └── matches/
│   │   │       ├── GroupMatchesSection.jsx
│   │   │       └── PlayoffSection.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with features
│   │   │   ├── Home.css
│   │   │   ├── NewTournament.jsx   # Multi-step tournament creation form
│   │   │   ├── NewTournament.css
│   │   │   ├── EditTournament.jsx  # Tournament editing form
│   │   │   ├── TournamentList.jsx  # List all tournaments
│   │   │   ├── TournamentList.css
│   │   │   ├── TournamentDetail.jsx # Tournament detail view
│   │   │   └── TournamentDetail.css
│   │   ├── App.jsx                 # Main app with routing
│   │   ├── App.css
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   └── package.json
├── backend/
│   ├── server.js                  # Express server bootstrapping routes/controllers
│   ├── database.js                # SQLite database initialization + migrations
│   ├── tournaments.db             # SQLite database file (gitignored)
│   ├── controllers/               # Modular controllers
│   ├── routes/                    # Modular routes
│   └── package.json
└── README.md
```

## Key Features

### 1. Multi-Step Tournament Creation
- **4 Steps**: Name → Type → Players → Details
- **Progress Bar**: Visual indicator with clickable steps (can only go back)
- **Validation**: Client-side validation before submission
- **Auto-capitalization**: First letter of name, place, and description
- **Inline Notifications**: Success/error messages displayed in-page (no alert dialogs)

### 2. Tournament Types
- **Pavouk**: Bracket/elimination system
- **Skupina**: Round-robin (everyone plays everyone)
- **Smíšený**: Mixed (groups followed by bracket)

### 3. Tournament List
- Grid layout with tournament cards
- Shows: name, date, location, type, player count, status
- Actions: View, Edit (navigates to edit page), Delete
- Empty state when no tournaments exist
- Loading and error states

### 4. Tournament Detail
- Comprehensive view of all tournament information
- Metadata (ID, creation date)
- Action buttons (Edit, Delete)
- Back navigation to list
- Group matches and play-off rendering are split into dedicated components
- Matches can be assigned to tables and marked "probíhá" before result entry
- Inline result selection/reset; auto-generation of next play-off round when relevant

### 5. Tournament Edit
- Route `/turnaje/:id/upravit` allows editing name, date, location, description, table count; type/max players locked after start
- Reuses creation form styling; shows inline notifications

## Database Schema

### tournaments table
```sql
CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nazev TEXT NOT NULL,              -- Tournament name
  typ TEXT NOT NULL,                -- Type: 'pavouk', 'skupina', 'smiseny'
  maxPocetHracu INTEGER NOT NULL,   -- Max players
  datum TEXT NOT NULL,              -- Date (ISO format)
  misto TEXT NOT NULL,              -- Location
  popis TEXT,                       -- Description (optional)
  pocetStolu INTEGER NOT NULL DEFAULT 1, -- Table count
  status TEXT DEFAULT 'nadchazejici', -- Status: 'nadchazejici', 'probiha', 'ukonceny'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### matches table (not exhaustive)
```sql
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id INTEGER,
  player2_id INTEGER,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id INTEGER,
  status TEXT DEFAULT 'nehrany',
  table_number INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Migrations
- `database.js` auto-adds columns `pocetStolu` to tournaments and `table_number` to matches if missing (PRAGMA-based check).

## API Endpoints

All endpoints are prefixed with `/api`

- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get single tournament
- `POST /api/tournaments` - Create new tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament
- `GET /api/health` - Health check
- `POST /api/tournaments/:id/start` - Generate matches and mark tournament as running
- `PUT /api/matches/:id/result` - Save match result
- `PUT /api/matches/:id/reset` - Reset match result/table assignment
- `PUT /api/matches/:id/state` - Set match status (e.g., `probiha`) and/or table assignment
- `POST /api/tournaments/:id/playoffs` - Generate play-off for mixed type
- `POST /api/tournaments/:id/playoffs/next-round` - Generate next play-off round when eligible
- `DELETE /api/tournaments/:id/playoffs` - Reset play-off

## Routes (Frontend)

- `/` - Home page
- `/novy-turnaj` - New tournament creation (multi-step form)
- `/turnaje` - Tournament list
- `/turnaje/:id` - Tournament detail
- `/turnaje/:id/upravit` - Tournament edit

## Important Implementation Details

### Form Handling
- Multi-step form uses local state to preserve data across steps
- Steps can be navigated by clicking step circles (backward only)
- Enter key in inputs triggers next step (not form submission)
- Validation happens per-step and on final submission
- Notifications appear inline above action buttons

### Styling Patterns
- Blue color scheme (`#2563eb`, `#1e3a8a`)
- Card-based layouts with shadows
- Responsive design with mobile breakpoints at 768px
- Hover effects for interactivity
- Status badges with color coding (blue=upcoming, green=active, gray=finished)
- Table/match badges for status and table assignment; action rows align table select left and result select right

### Data Flow
1. User fills form in NewTournament
2. POST to `/api/tournaments`
3. Database saves via sql.js
4. Redirect to `/turnaje`
5. List fetches from GET `/api/tournaments`
6. Click "Zobrazit" navigates to `/turnaje/:id`
7. Detail page fetches from GET `/api/tournaments/:id`
8. Matches can be set to "probíhá" and assigned to tables (1..pocetStolu) before recording results
9. Play-off (mixed) can be generated/reset; next rounds auto/create when conditions met

## Czech Language Terms

Key translations used in the app:
- Turnaj = Tournament
- Název = Name
- Typ = Type
- Hráči = Players
- Datum konání = Event date
- Místo konání = Location/Venue
- Popis = Description
- Vytvořit = Create
- Zobrazit = View/Show
- Upravit = Edit
- Smazat = Delete
- Zpět = Back
- Další = Next
- Nadcházející = Upcoming
- Probíhá = In progress
- Ukončený = Finished

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
node server.js
```

## Common Patterns to Follow

1. **Always use Czech language** for all UI text
2. **Use English for variable/function names**; keep data keys consistent with API fields (current payload fields remain in Czech)
2. **Auto-capitalize first letters** for name, place, description fields
3. **Use inline notifications** instead of alert() dialogs
4. **Validate on client-side** before sending to backend
5. **Handle loading and error states** for all async operations
6. **Use React Router navigation** (useNavigate hook)
7. **Maintain consistent styling** with existing CSS patterns

## Known Limitations / Future Features

- Edit functionality implemented (page `/turnaje/:id/upravit`)
- No player management beyond add/delete list
- No actual bracket drawing; play-off matches are textual lists
- No real-time updates
- Single-user application (no authentication)

## Git Workflow

- Main branch: `main`
- Database files are gitignored
- Node_modules are gitignored
- Build outputs are gitignored
