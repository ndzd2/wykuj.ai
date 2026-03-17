import { create } from 'zustand';
import { database } from '../database/db';
import { authService } from '../services/authService';
import { aiService } from '../services/aiService';

export const useStore = create((set, get) => ({
  user: null,
  projects: [],
  currentProject: null,
  materials: [],
  flashcards: [],
  quizzes: [],
  currentQuizQuestions: [],
  chatMessages: [],
  chatSessions: [],
  currentSession: null,
  searchQuery: '',
  loading: false,

  setUser: (user) => set({ user }),

  checkSession: async () => {
    const user = await authService.getSession();
    if (user) {
      set({ user });
      get().fetchProjects();
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const user = await authService.login(email, password);
      set({ user, loading: false });
      get().fetchProjects();
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ loading: true });
    try {
      const user = await authService.register(email, password);
      set({ user, loading: false });
      get().fetchProjects();
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, projects: [], currentProject: null, materials: [] });
  },

  fetchProjects: async () => {
    const user = get().user;
    if (!user) return;
    
    set({ loading: true });
    try {
      const projects = await database.getProjects(user.id);
      set({ projects, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  selectProject: async (project) => {
    set({ currentProject: project, loading: true });
    try {
      const materials = await database.getMaterials(project.id);
      const flashcards = await database.getFlashcards(project.id);
      const quizzes = await database.getQuizzes(project.id);
      
      // Load chat sessions and the most recent one
      const chatSessions = await database.getChatSessions(project.id);
      let currentSession = chatSessions[0] || null;
      let chatMessages = [];
      
      if (currentSession) {
        chatMessages = await database.getChatMessages(currentSession.id);
      }

      set({ materials, flashcards, quizzes, chatSessions, currentSession, chatMessages, searchQuery: '', loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  addProject: async (name, description) => {
    const user = get().user;
    if (!user) return;

    try {
      await database.createProject(user.id, name, description);
      get().fetchProjects();
    } catch (error) {
      console.error(error);
    }
  },

  addMaterial: async (projectId, name, content, type) => {
    try {
      await database.addMaterial(projectId, name, content, type);
      if (get().currentProject?.id === projectId) {
        const materials = await database.getMaterials(projectId);
        set({ materials });
      }
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateMaterial: async (id, name, content) => {
    try {
      await database.updateMaterial(id, name, content);
      const projectId = get().currentProject?.id;
      if (projectId) {
        const materials = await database.getMaterials(projectId);
        set({ materials });
      }
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteMaterial: async (id) => {
    try {
      await database.deleteMaterial(id);
      const projectId = get().currentProject?.id;
      if (projectId) {
        const materials = await database.getMaterials(projectId);
        set({ materials });
      }
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  fetchFlashcards: async (projectId) => {
    try {
      const flashcards = await database.getFlashcards(projectId);
      set({ flashcards });
    } catch (error) {
      console.error(error);
    }
  },

  generateFlashcards: async () => {
    const { currentProject, materials } = get();
    if (!currentProject || materials.length === 0) return;

    set({ loading: true });
    try {
      // Get ALL flashcards (including learned) to avoid repeats in AI generation
      const allFlashcards = await database.getFlashcards(currentProject.id, true);
      const context = materials.map(m => m.content).join('\n\n');
      const newCards = await aiService.generateFlashcards(context, allFlashcards);
      
      await database.saveFlashcards(currentProject.id, newCards);
      await get().fetchFlashcards(currentProject.id);
      set({ loading: false });
      return true;
    } catch (error) {
      console.error(error);
      set({ loading: false });
      throw error;
    }
  },

  deleteFlashcard: async (id) => {
    try {
      await database.deleteFlashcard(id);
      const projectId = get().currentProject?.id;
      if (projectId) {
        await get().fetchFlashcards(projectId);
      }
    } catch (error) {
      console.error(error);
    }
  },

  markFlashcardAsLearned: async (id) => {
    try {
      await database.markFlashcardAsLearned(id);
      const projectId = get().currentProject?.id;
      if (projectId) {
        await get().fetchFlashcards(projectId);
      }
    } catch (error) {
      console.error(error);
    }
  },

  fetchQuizzes: async (projectId) => {
    try {
      const quizzes = await database.getQuizzes(projectId);
      set({ quizzes });
    } catch (error) {
      console.error(error);
    }
  },

  generateQuiz: async (count = 5) => {
    const { currentProject, materials } = get();
    if (!currentProject || materials.length === 0) return;

    set({ loading: true });
    try {
      const context = materials.map(m => m.content).join('\n\n');
      const questions = await aiService.generateQuiz(context, count);
      
      const title = `Quiz: ${new Date().toLocaleDateString('pl-PL')} (${count} pyt.)`;
      const quizId = await database.createQuiz(currentProject.id, title, count);
      await database.addQuizQuestions(quizId, questions);
      
      await get().fetchQuizzes(currentProject.id);
      set({ loading: false });
      return quizId;
    } catch (error) {
      console.error(error);
      set({ loading: false });
      throw error;
    }
  },

  getQuizQuestions: async (quizId) => {
    try {
      return await database.getQuizQuestions(quizId);
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  saveQuizResult: async (quizId, score, answers) => {
    try {
      await database.updateQuizResult(quizId, score, answers);
      const projectId = get().currentProject?.id;
      if (projectId) {
        await get().fetchQuizzes(projectId);
      }
    } catch (error) {
      console.error(error);
    }
  },

  deleteQuiz: async (id) => {
    try {
      await database.deleteQuiz(id);
      const projectId = get().currentProject?.id;
      if (projectId) {
        await get().fetchQuizzes(projectId);
      }
    } catch (error) {
      console.error(error);
    }
  },

  // --- Chat Actions ---
  fetchChatSessions: async (projectId) => {
    try {
      const chatSessions = await database.getChatSessions(projectId);
      set({ chatSessions });
    } catch (error) {
      console.error(error);
    }
  },

  createNewSession: async (projectId, title = 'Nowy czat') => {
    try {
      const sessionId = await database.createChatSession(projectId, title);
      const chatSessions = await database.getChatSessions(projectId);
      const currentSession = chatSessions.find(s => s.id === sessionId);
      set({ chatSessions, currentSession, chatMessages: [] });
      return sessionId;
    } catch (error) {
      console.error(error);
    }
  },
  switchSession: async (session) => {
    set({ loading: true });
    try {
      const chatMessages = await database.getChatMessages(session.id);
      set({ currentSession: session, chatMessages, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  updateSessionTitle: async (sessionId, title) => {
    try {
      await database.updateChatSessionTitle(sessionId, title);
      const projectId = get().currentProject?.id;
      if (projectId) {
        const sessions = await database.getChatSessions(projectId);
        set({ 
          chatSessions: sessions,
          currentSession: sessions.find(s => s.id === sessionId) || get().currentSession
        });
      }
    } catch (error) {
      console.error(error);
    }
  },

  sendChatMessage: async (projectId, content) => {
    const { currentSession, chatMessages } = get();
    
    try {
      // 1. Ensure we have a session
      let activeSession = currentSession;
      if (!activeSession) {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        const sessionId = await database.createChatSession(projectId, title);
        const sessions = await database.getChatSessions(projectId);
        activeSession = sessions.find(s => s.id === sessionId);
        set({ chatSessions: sessions, currentSession: activeSession });
      }

      // 2. Save user message
      await database.saveChatMessage(activeSession.id, projectId, 'user', content);
      
      // 3. Update local state
      const userMessage = { role: 'user', content };
      const newMessages = [...chatMessages, userMessage];
      set({ chatMessages: newMessages });

      // 4. AIService context
      const materials = get().materials;
      const context = materials.map(m => `Plik: ${m.name}\nTreść: ${m.content}`).join('\n\n');
      const systemMessage = { 
        role: 'system', 
        content: `Jesteś asystentem naukowym. Odpowiadaj na pytania na podstawie poniższych materiałów:\n\n${context}` 
      };
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));

      // 5. Get AI response
      const response = await aiService.sendMessage([systemMessage, ...history, userMessage]);
      
      // 6. Save assistant response
      await database.saveChatMessage(activeSession.id, projectId, 'assistant', response);
      
      // 7. Auto-generate title if it's the first exchange
      if (chatMessages.length === 0) {
        try {
          const autoTitle = await aiService.generateChatTitle(content, response);
          await database.updateChatSessionTitle(activeSession.id, autoTitle);
          const sessions = await database.getChatSessions(projectId);
          set({ 
            chatSessions: sessions, 
            currentSession: sessions.find(s => s.id === activeSession.id) 
          });
        } catch (titleError) {
          console.error('Failed to auto-generate title:', titleError);
        }
      }

      // 8. Final sync
      const finalMessages = await database.getChatMessages(activeSession.id);
      set({ chatMessages: finalMessages });
      
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteChatSession: async (sessionId) => {
    try {
      await database.deleteChatSession(sessionId);
      const projectId = get().currentProject?.id;
      if (projectId) {
        const sessions = await database.getChatSessions(projectId);
        set({ chatSessions: sessions });
        if (get().currentSession?.id === sessionId) {
          if (sessions.length > 0) {
            get().switchSession(sessions[0]);
          } else {
            set({ currentSession: null, chatMessages: [] });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}));
