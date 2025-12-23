import { getDB, saveDB } from '../database.js';
import { rowsToObjects, rowToObject, getSingleValue } from '../utils/dbHelpers.js';

export const getAllTournaments = (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM tournaments ORDER BY datum DESC');
    const tournaments = rowsToObjects(result);
    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Chyba při načítání turnajů' });
  }
};

export const getTournamentById = (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM tournaments WHERE id = ?', [parseInt(req.params.id)]);
    const tournament = rowToObject(result);

    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Chyba při načítání turnaje' });
  }
};

export const createTournament = (req, res) => {
  try {
    const {
      nazev: name,
      typ: type,
      datum: date,
      misto: location,
      popis: description,
      pocetStolu: tableCount,
      pocetSkupin: groupsCount,
      rozpis: schedule
    } = req.body;

    if (!name || !type || !date || !location) {
      return res.status(400).json({ error: 'Chybí povinná pole' });
    }

    const tables = tableCount ? parseInt(tableCount) : 1;
    if (Number.isNaN(tables) || tables < 1) {
      return res.status(400).json({ error: 'Počet stolů musí být alespoň 1' });
    }

    const db = getDB();
  // Validate schedule type
  const allowedSchedules = ['standard', 'berger'];
  const scheduleType = allowedSchedules.includes(schedule) ? schedule : 'standard';

    // Validate number of groups if provided (for 'skupina' or 'smiseny')
    let numGroups = groupsCount ? parseInt(groupsCount) : 1;
    if (Number.isNaN(numGroups) || numGroups < 1) {
      numGroups = 1;
    }
    db.run(
      'INSERT INTO tournaments (nazev, typ, maxPocetHracu, datum, misto, popis, pocetStolu, pocetSkupin, rozpis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, type, 999, date, location, description || '', tables, numGroups, scheduleType]
    );
    saveDB();

    const result = db.exec('SELECT * FROM tournaments ORDER BY id DESC LIMIT 1');
    const newTournament = rowToObject(result);

    res.status(201).json(newTournament || { error: 'Chyba při vytváření turnaje' });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Chyba při vytváření turnaje' });
  }
};

export const updateTournament = (req, res) => {
  try {
    const {
      nazev: name,
      typ: type,
      datum: date,
      misto: location,
      popis: description,
      status,
      pocetStolu: tableCount,
      pocetSkupin: groupsCount,
      rozpis: schedule
    } = req.body;
      // Validate schedule if provided
      const allowedSchedulesU = ['standard', 'berger'];
      const scheduleTypeU = allowedSchedulesU.includes(schedule) ? schedule : undefined;
    const db = getDB();
    // Validate number of groups if provided
    let numGroups = groupsCount ? parseInt(groupsCount) : undefined;
    if (numGroups !== undefined) {
      if (Number.isNaN(numGroups) || numGroups < 1) {
        return res.status(400).json({ error: 'Počet skupin musí být alespoň 1' });
      }
    }

    const tables = tableCount ? parseInt(tableCount) : 1;
    if (Number.isNaN(tables) || tables < 1) {
      return res.status(400).json({ error: 'Počet stolů musí být alespoň 1' });
    }

    const updates = ['nazev = ?', 'typ = ?', 'datum = ?', 'misto = ?', 'popis = ?', 'status = ?', 'pocetStolu = ?'];
    const params = [name, type, date, location, description || '', status || 'nadchazejici', tables];
    if (numGroups !== undefined) {
      updates.push('pocetSkupin = ?');
      params.push(numGroups);
    }
    if (scheduleTypeU !== undefined) {
      updates.push('rozpis = ?');
      params.push(scheduleTypeU);
    }
    updates.push('id = ?');
    params.push(parseInt(req.params.id));
    db.run(`UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDB();

    const result = db.exec('SELECT * FROM tournaments WHERE id = ?', [parseInt(req.params.id)]);
    const updatedTournament = rowToObject(result);

    if (!updatedTournament) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    res.json(updatedTournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci turnaje' });
  }
};

export const deleteTournament = (req, res) => {
  try {
    const db = getDB();
    db.run('DELETE FROM tournaments WHERE id = ?', [parseInt(req.params.id)]);
    saveDB();
    res.json({ message: 'Turnaj byl úspěšně smazán' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Chyba při mazání turnaje' });
  }
};
