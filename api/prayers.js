import { executeQuery } from './_lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const prayers = await executeQuery('SELECT * FROM prayers ORDER BY createdAt DESC');
      const mapped = prayers.map(p => ({
        ...p,
        isPublic: p.isPublic === '1' || p.isPublic === 1,
        isApproved: p.isApproved === undefined || p.isApproved === null || p.isApproved === '1' || p.isApproved === 1,
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
        'INSERT INTO prayers (id, name, category, text, isPublic, isApproved, prayerCount) VALUES (?, ?, ?, ?, ?, 1, 0)',
        [id, name, category, text, isPublic ? 1 : 0]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { id, isApproved } = req.body;
      await executeQuery(
        'UPDATE prayers SET isApproved = ? WHERE id = ?',
        [isApproved ? 1 : 0, id]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body || req.query;
      await executeQuery(
        'DELETE FROM prayers WHERE id = ?',
        [id]
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
