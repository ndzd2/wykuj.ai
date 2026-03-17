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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER
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
      is_learned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON string array
      correct_answer TEXT NOT NULL,
      user_answer TEXT,
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      project_id INTEGER, -- kept for backward compatibility and easy project-wide queries
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  const tableInfo = await db.getAllAsync("PRAGMA table_info(projects);");
  const hasUserId = tableInfo.some(column => column.name === 'user_id');
  if (!hasUserId) {
    try {
      await db.execAsync("ALTER TABLE projects ADD COLUMN user_id INTEGER;");
      console.log('Added user_id column to projects table');
    } catch (error) {
      console.error('Migration failed (projects):', error);
    }
  }

  // Migration: Add is_learned to flashcards
  const flashcardInfo = await db.getAllAsync("PRAGMA table_info(flashcards);");
  const hasIsLearned = flashcardInfo.some(column => column.name === 'is_learned');
  if (!hasIsLearned) {
    try {
      await db.execAsync("ALTER TABLE flashcards ADD COLUMN is_learned INTEGER DEFAULT 0;");
      console.log('Added is_learned column to flashcards table');
    } catch (error) {
      console.error('Migration failed (flashcards):', error);
    }
  }

  // Migration: Add session_id to chat_messages if it's missing (from previous task)
  const chatInfo = await db.getAllAsync("PRAGMA table_info(chat_messages);");
  const hasSessionId = chatInfo.some(column => column.name === 'session_id');
  if (!hasSessionId) {
    try {
      await db.execAsync("ALTER TABLE chat_messages ADD COLUMN session_id INTEGER;");
      console.log('Added session_id column to chat_messages table');
    } catch (error) {
           console.error('Migration failed (chat_messages):', error);
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

  getFlashcards: async (projectId, includeLearned = false) => {
    const db = await openDB();
    const query = includeLearned 
      ? 'SELECT * FROM flashcards WHERE project_id = ? ORDER BY created_at DESC;'
      : 'SELECT * FROM flashcards WHERE project_id = ? AND is_learned = 0 ORDER BY created_at DESC;';
    return await db.getAllAsync(query, [projectId]);
  },

  markFlashcardAsLearned: async (id) => {
    const db = await openDB();
    await db.runAsync('UPDATE flashcards SET is_learned = 1 WHERE id = ?;', [id]);
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
  },

  // --- Quiz Methods ---
  createQuiz: async (projectId, title, totalQuestions) => {
    const db = await openDB();
    const result = await db.runAsync(
      'INSERT INTO quizzes (project_id, title, total_questions) VALUES (?, ?, ?);',
      [projectId, title, totalQuestions]
    );
    return result.lastInsertRowId;
  },

  addQuizQuestions: async (quizId, questions) => {
    const db = await openDB();
    for (const q of questions) {
      await db.runAsync(
        'INSERT INTO quiz_questions (quiz_id, question, options, correct_answer) VALUES (?, ?, ?, ?);',
        [quizId, q.question, JSON.stringify(q.options), q.correct_answer]
      );
    }
  },

  getQuizzes: async (projectId) => {
    const db = await openDB();
    return await db.getAllAsync(
      'SELECT * FROM quizzes WHERE project_id = ? ORDER BY created_at DESC;',
      [projectId]
    );
  },

  getQuizQuestions: async (quizId) => {
    const db = await openDB();
    const rows = await db.getAllAsync('SELECT * FROM quiz_questions WHERE quiz_id = ?;', [quizId]);
    return rows.map(r => ({ ...r, options: JSON.parse(r.options) }));
  },

  updateQuizResult: async (quizId, score, userAnswersMap) => {
    const db = await openDB();
    await db.runAsync('UPDATE quizzes SET score = ? WHERE id = ?;', [score, quizId]);
    
    // userAnswersMap: { questionId: answerText }
    for (const [qId, ans] of Object.entries(userAnswersMap)) {
      await db.runAsync('UPDATE quiz_questions SET user_answer = ? WHERE id = ?;', [ans, qId]);
    }
  },

  deleteQuiz: async (id) => {
    const db = await openDB();
    await db.runAsync('DELETE FROM quizzes WHERE id = ?;', [id]);
  },

  // --- Chat History Methods ---
  createChatSession: async (projectId, title = 'Nowy czat') => {
    const db = await openDB();
    const result = await db.runAsync(
      'INSERT INTO chat_sessions (project_id, title) VALUES (?, ?);',
      [projectId, title]
    );
    return result.lastInsertRowId;
  },

  getChatSessions: async (projectId) => {
    const db = await openDB();
    return await db.getAllAsync(
      'SELECT * FROM chat_sessions WHERE project_id = ? ORDER BY created_at DESC;',
      [projectId]
    );
  },

  saveChatMessage: async (sessionId, projectId, role, content) => {
    const db = await openDB();
    const result = await db.runAsync(
      'INSERT INTO chat_messages (session_id, project_id, role, content) VALUES (?, ?, ?, ?);',
      [sessionId, projectId, role, content]
    );
    return result.lastInsertRowId;
  },

  getChatMessages: async (sessionId) => {
    const db = await openDB();
    return await db.getAllAsync(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC;',
      [sessionId]
    );
  },

  deleteChatSession: async (sessionId) => {
    const db = await openDB();
    await db.runAsync('DELETE FROM chat_sessions WHERE id = ?;', [sessionId]);
  },

  updateChatSessionTitle: async (sessionId, title) => {
    const db = await openDB();
    await db.runAsync('UPDATE chat_sessions SET title = ? WHERE id = ?;', [title, sessionId]);
  }
};
