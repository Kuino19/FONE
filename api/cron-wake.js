import { executeQuery } from './_lib/turso.js';

export default async function handler(req, res) {
  try {
    // A tiny query to ping the database and prevent it from sleeping/archiving
    await executeQuery('SELECT 1');
    res.status(200).json({ success: true, message: 'Turso database pinged successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
