import { executeQuery } from './_lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const testimonies = await executeQuery('SELECT * FROM testimonies ORDER BY createdAt DESC');
      const mapped = testimonies.map(t => ({
        ...t,
        featured: t.featured === '1' || t.featured === 1,
        amenCount: parseInt(t.amenCount || 0, 10)
      }));
      res.status(200).json(mapped);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { id, name, category, text } = req.body;
      await executeQuery(
        'INSERT INTO testimonies (id, name, category, text, featured, amenCount) VALUES (?, ?, ?, ?, 0, 0)',
        [id, name, category, text]
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
