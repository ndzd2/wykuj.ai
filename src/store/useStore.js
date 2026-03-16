import { create } from 'zustand';
import { database } from '../database/db';

export const useStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  materials: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await database.getProjects();
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
    try {
      await database.createProject(name, description);
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
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
    }
  }
}));
