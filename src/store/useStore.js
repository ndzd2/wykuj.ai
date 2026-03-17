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
      set({ materials, flashcards, quizzes, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

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
  }
}));
