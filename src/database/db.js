import * as SQLite from 'expo-sqlite';

// For SDK 52, the API is different. openDatabaseSync is the modern way.
const openDB = async () => {
  return await SQLite.openDatabaseAsync('wykuj_ai.db');
};

export const initDatabase = async () => {
  const db = await openDB();
  
  // Basic migrations/initialization
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT, 
      description TEXT, 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      project_id INTEGER, 
      name TEXT, 
      content TEXT, 
      type TEXT, 
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Migration: Add user_id to projects if it doesn't exist
  const tableInfo = await db.getAllAsync("PRAGMA table_info(projects);");
  const hasUserId = tableInfo.some(column => column.name === 'user_id');
  if (!hasUserId) {
    try {
      await db.execAsync("ALTER TABLE projects ADD COLUMN user_id INTEGER;");
      console.log('Added user_id column to projects table');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
};

export const database = {
  // --- Auth Methods ---
  registerUser: async (email, passwordHash) => {
    const db = await openDB();
    const result = await db.runAsync('INSERT INTO users (email, password_hash) VALUES (?, ?);', [email, passwordHash]);
    return result.lastInsertRowId;
  },

  getUserByEmail: async (email) => {
    const db = await openDB();
    return await db.getFirstAsync('SELECT * FROM users WHERE email = ?;', [email]);
  },

  // --- Scoped Project Methods ---
  createProject: async (userId, name, description = '') => {
    const db = await openDB();
    const result = await db.runAsync('INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?);', [userId, name, description]);
    return result.lastInsertRowId;
  },

  getProjects: async (userId) => {
    const db = await openDB();
    return await db.getAllAsync('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC;', [userId]);
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
  },

  // --- Flashcards Methods ---
  addFlashcard: async (projectId, question, answer) => {
    const db = await openDB();
    const result = await db.runAsync('INSERT INTO flashcards (project_id, question, answer) VALUES (?, ?, ?);', [projectId, question, answer]);
    return result.lastInsertRowId;
  },

  getFlashcards: async (projectId) => {
    const db = await openDB();
    return await db.getAllAsync('SELECT * FROM flashcards WHERE project_id = ? ORDER BY created_at DESC;', [projectId]);
  },

  deleteFlashcard: async (id) => {
    const db = await openDB();
    await db.runAsync('DELETE FROM flashcards WHERE id = ?;', [id]);
  },

  saveFlashcards: async (projectId, flashcards) => {
    const db = await openDB();
    for (const card of flashcards) {
      await db.runAsync('INSERT INTO flashcards (project_id, question, answer) VALUES (?, ?, ?);', [projectId, card.question, card.answer]);
    }
  }
};
