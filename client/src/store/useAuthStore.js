import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Register User (Redirects to Login, does not auto-login)
  register: async (name, email, password, avatar) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', { name, email, password, avatar });
      set({ loading: false });
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
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('token', token);
      }
      set({
        user,
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
    } catch (error) {
      console.error('Logout error:', error.message);
    } finally {
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      return { success: true };
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
      localStorage.removeItem('token');
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
