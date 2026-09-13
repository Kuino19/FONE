import { executeQuery } from './_lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const prayers = await executeQuery('SELECT * FROM prayers ORDER BY createdAt DESC');
      // Convert SQLite boolean back to JS boolean
      const mapped = prayers.map(p => ({
        ...p,
        isPublic: p.isPublic === '1' || p.isPublic === 1,
        prayerCount: parseInt(p.prayerCount || 0, 10)
      }));
      res.status(200).json(mapped);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { id, name, category, text, isPublic } = req.body;
      await executeQuery(
        'INSERT INTO prayers (id, name, category, text, isPublic, prayerCount) VALUES (?, ?, ?, ?, ?, 0)',
        [id, name, category, text, isPublic ? 1 : 0]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
