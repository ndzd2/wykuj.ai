import { create } from 'zustand';
import { database } from '../database/db';
import { authService } from '../services/authService';

export const useStore = create((set, get) => ({
  user: null,
  projects: [],
  currentProject: null,
  materials: [],
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
      set({ materials, loading: false });
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
  }
}));
