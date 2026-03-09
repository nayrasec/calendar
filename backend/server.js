const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { query, queryOne, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

// ===== CONSTELLATION ENDPOINTS =====

// Get all constellations
app.get('/api/constellations', async (req, res) => {
  try {
    const constellations = await query('SELECT * FROM constellations ORDER BY created_at DESC');
    res.json(constellations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single constellation with its memories
app.get('/api/constellations/:id', async (req, res) => {
  try {
    const constellation = await queryOne('SELECT * FROM constellations WHERE id = ?', [req.params.id]);
    if (!constellation) {
      return res.status(404).json({ error: 'Constellation not found' });
    }

    const memories = await query(
      'SELECT * FROM memories WHERE constellation_id = ? ORDER BY star_index',
      [req.params.id]
    );

    res.json({ ...constellation, memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get constellation by name
app.get('/api/constellations/name/:name', async (req, res) => {
  try {
    const constellation = await queryOne('SELECT * FROM constellations WHERE name = ?', [req.params.name]);
    if (!constellation) {
      return res.status(404).json({ error: 'Constellation not found' });
    }

    const memories = await query(
      'SELECT * FROM memories WHERE constellation_id = ? ORDER BY star_index',
      [constellation.id]
    );

    res.json({ ...constellation, memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new constellation
app.post('/api/constellations', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Constellation name is required' });
    }

    // Check if constellation already exists
    const existing = await queryOne('SELECT id FROM constellations WHERE name = ?', [name]);
    if (existing) {
      return res.status(400).json({ error: 'Constellation already exists' });
    }

    const result = await run(
      'INSERT INTO constellations (name) VALUES (?)',
      [name.trim().toUpperCase()]
    );

    const newConstellation = await queryOne('SELECT * FROM constellations WHERE id = ?', [result.id]);
    res.status(201).json(newConstellation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MEMORY ENDPOINTS =====

// Add or update memory to a star
app.post('/api/memories', async (req, res) => {
  try {
    const { constellation_id, star_index, title, description, date } = req.body;

    if (!constellation_id || star_index === undefined || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if memory already exists for this star
    const existing = await queryOne(
      'SELECT id FROM memories WHERE constellation_id = ? AND star_index = ?',
      [constellation_id, star_index]
    );

    let result;
    if (existing) {
      // Update existing memory
      await run(
        'UPDATE memories SET title = ?, description = ?, date = ? WHERE constellation_id = ? AND star_index = ?',
        [title, description, date || null, constellation_id, star_index]
      );
      result = existing;
    } else {
      // Create new memory
      result = await run(
        'INSERT INTO memories (constellation_id, star_index, title, description, date) VALUES (?, ?, ?, ?, ?)',
        [constellation_id, star_index, title, description, date || null]
      );
    }

    const memory = await queryOne('SELECT * FROM memories WHERE id = ?', [existing ? existing.id : result.id]);
    res.status(201).json(memory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get memory details
app.get('/api/memories/:id', async (req, res) => {
  try {
    const memory = await queryOne('SELECT * FROM memories WHERE id = ?', [req.params.id]);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete memory
app.delete('/api/memories/:id', async (req, res) => {
  try {
    const memory = await queryOne('SELECT * FROM memories WHERE id = ?', [req.params.id]);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    await run('DELETE FROM memories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ERROR HANDLING =====

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌌 Our Universe server running on http://localhost:${PORT}`);
});
