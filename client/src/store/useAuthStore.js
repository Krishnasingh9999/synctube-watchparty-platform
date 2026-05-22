import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  loading: false,
  error: null,

  // Send OTP verification code to user's email
  sendOtp: async (email, name) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/send-otp', { email, name });
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification code';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Verify OTP verification code
  verifyOtp: async (email, otp) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      set({ loading: false });
      return { success: true, emailToken: response.data.emailToken, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Register User (Redirects to Login, does not auto-login)
  register: async (name, email, password, avatar, emailToken) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', { name, email, password, avatar, emailToken });
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
    }
    return { success: true };
  },

  // Verify cookie session on startup
  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch {
      localStorage.removeItem('token');
      // Clean auth session state if verification fails
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
    }
  },

  // Request password reset email
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send password reset request';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  clearError: () => set({ error: null }),
}));
