// server.js
import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Route: GET all users from PostgreSQL
app.get('/api/users', async (req, res) => {
 try {
 const result = await pool.query('SELECT * FROM users');
 res.json(result.rows);
 } catch (err) {
 console.error(err);
 res.status(500).json({ error: 'Database error' });
 }
});

app.listen(3000, () => console.log('Server running on port 3000'));