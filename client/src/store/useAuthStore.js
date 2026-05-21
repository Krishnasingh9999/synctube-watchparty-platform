import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Register User
  register: async (name, email, password, avatar) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, avatar });
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Login User
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Logout User
  logout: async () => {
    set({ loading: true });
    try {
      await api.post('/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Logout failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Verify cookie session on startup
  checkAuth: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      // Clean auth session state if verification fails
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
