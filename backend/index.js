const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Configure PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '12345678',
  database: process.env.PGDATABASE || 'housing_maintenance_cv',
});

// GET /search - returns buildings matching provided filters
app.get('/search', async (req, res) => {
  const { borough, neighborhood, houseNumber, streetName, postcode } = req.query;

  // If borough name provided, get its ID
  let boroughId;
  if (borough) {
    try {
      const bRes = await pool.query(
        'SELECT borough_id FROM borough WHERE borough_name ILIKE $1',
        [borough]
      );
      if (bRes.rowCount === 0) {
        return res.json([]); // no such borough
      }
      boroughId = bRes.rows[0].borough_id;
    } catch (err) {
      console.error('Error fetching borough_id:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // If neighbourhood provided, get its NTA ID (optionally scoping by borough)
  let ntaId;
  if (neighborhood) {
    const ntaVals = [`%${neighborhood}%`];
    let ntaSql = 'SELECT nta_id FROM nta WHERE nta_name ILIKE $1';
    if (boroughId !== undefined) {
      ntaSql += ' AND borough_id = $2';
      ntaVals.push(boroughId);
    }
    try {
      const nRes = await pool.query(ntaSql, ntaVals);
      if (nRes.rowCount === 0) {
        return res.json([]); // no such neighbourhood in this borough
      }
      ntaId = nRes.rows[0].nta_id;
    } catch (err) {
      console.error('Error fetching nta_id:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  const filters = [];
  const values = [];

  // filter by borough_id if looked up
  if (boroughId !== undefined) {
    values.push(boroughId);
    filters.push(`borough_id = $${values.length}`);
  }
  // filter by nta_id if looked up
  if (ntaId !== undefined) {
    values.push(ntaId);
    filters.push(`nta_id = $${values.length}`);
  }

  // other building column filters
  if (houseNumber) {
    values.push(houseNumber);
    filters.push(`house_number = $${values.length}`);
  }
  if (streetName) {
    values.push(`%${streetName}%`);
    filters.push(`street_name ILIKE $${values.length}`);
  }
  if (postcode) {
    values.push(postcode);
    filters.push(`postcode = $${values.length}`);
  }

  let sql = 'SELECT * FROM building';
  if (filters.length) sql += ' WHERE ' + filters.join(' AND ');

  try {
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /violations - returns violations for a specific building
app.get('/violations', async (req, res) => {
  const { buildingId } = req.query;
  if (!buildingId) return res.status(400).json({ error: 'Missing buildingId parameter' });
  try {
    const result = await pool.query(
      `SELECT v.*, vc.type_description
       FROM violation v
       JOIN violation_class vc ON v.class_type = vc.class_type
       WHERE v.building_id = $1`,
      [buildingId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching violations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});