import { executeQuery } from './_lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { id, increment } = req.body;
      const change = increment === false ? -1 : 1;
      await executeQuery(
        'UPDATE prayers SET prayerCount = MAX(0, prayerCount + ?) WHERE id = ?',
        [change, id]
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
