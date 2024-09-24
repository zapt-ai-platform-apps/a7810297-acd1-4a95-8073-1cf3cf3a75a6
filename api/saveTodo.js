import { todos } from '../drizzle/schema.js';
import { authenticateUser } from "./_apiUtils.js";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticateUser(req);
    const sql = neon(process.env.NEON_DB_URL);
    const db = drizzle(sql);

    if (req.method === 'POST') {
      const { task } = req.body;

      if (!task) {
        return res.status(400).json({ error: 'Task is required' });
      }

      const result = await db.insert(todos).values({ 
        task, 
        userId: user.id
      }).returning();

      res.status(201).json(result[0]);
    } else if (req.method === 'PUT') {
      const { id, completed } = req.body;

      if (id === undefined || completed === undefined) {
        return res.status(400).json({ error: 'ID and completed status are required' });
      }

      const result = await db.update(todos)
        .set({ completed })
        .where(eq(todos.id, id))
        .returning();

      res.status(200).json(result[0]);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (id === undefined) {
        return res.status(400).json({ error: 'ID is required' });
      }

      await db.delete(todos)
        .where(eq(todos.id, id));

      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Error handling todo:', error);
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(500).json({ error: 'Error handling todo' });
    }
  }
}