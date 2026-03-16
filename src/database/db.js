import * as SQLite from 'expo-sqlite';

// For SDK 52, the API is different. openDatabaseSync is the modern way.
const openDB = async () => {
  return await SQLite.openDatabaseAsync('wykuj_ai.db');
};

export const initDatabase = async () => {
  const db = await openDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS materials (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, name TEXT, content TEXT, type TEXT, FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE);
  `);
};

export const database = {
  createProject: async (name, description = '') => {
    const db = await openDB();
    const result = await db.runAsync('INSERT INTO projects (name, description) VALUES (?, ?);', [name, description]);
    return result.lastInsertRowId;
  },

  getProjects: async () => {
    const db = await openDB();
    return await db.getAllAsync('SELECT * FROM projects ORDER BY created_at DESC;');
  },

  addMaterial: async (projectId, name, content, type = 'text') => {
    const db = await openDB();
    const result = await db.runAsync('INSERT INTO materials (project_id, name, content, type) VALUES (?, ?, ?, ?);', [projectId, name, content, type]);
    return result.lastInsertRowId;
  },

  getMaterials: async (projectId) => {
    const db = await openDB();
    return await db.getAllAsync('SELECT * FROM materials WHERE project_id = ?;', [projectId]);
  },

  updateMaterial: async (id, name, content) => {
    const db = await openDB();
    await db.runAsync('UPDATE materials SET name = ?, content = ? WHERE id = ?;', [name, content, id]);
  },

  deleteMaterial: async (id) => {
    const db = await openDB();
    await db.runAsync('DELETE FROM materials WHERE id = ?;', [id]);
  }
};
