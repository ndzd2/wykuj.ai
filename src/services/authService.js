import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { database } from '../database/db';

// Bcrypt fallback for React Native environment
bcrypt.setRandomFallback((len) => {
  const bytes = Crypto.getRandomBytes(len);
  return Array.from(bytes);
});

const USER_SESSION_KEY = 'user_session';

export const authService = {
  async register(email, password, name) {
    try {
      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        throw new Error('Użytkownik o takim adresie e-mail już istnieje.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const userId = await database.registerUser(email, passwordHash, name);
      const user = { id: userId, email, name, premium_until: null };
      
      await this.saveSession(user);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const user = await database.getUserByEmail(email);
      if (!user) {
        throw new Error('Nieprawidłowy e-mail lub hasło.');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Nieprawidłowy e-mail lub hasło.');
      }

      const userData = { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        premium_until: user.premium_until 
      };
      await this.saveSession(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
  },

  async saveSession(user) {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(user));
  },

  async getSession() {
    const session = await SecureStore.getItemAsync(USER_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  async updateProfile(userId, data) {
    await database.updateUserProfile(userId, data);
    const session = await this.getSession();
    if (session && session.id === userId) {
      const updatedSession = { ...session, ...data };
      await this.saveSession(updatedSession);
      return updatedSession;
    }
  },

  async updateEmail(userId, email) {
    await database.updateUserEmail(userId, email);
    const session = await this.getSession();
    if (session && session.id === userId) {
      const updatedSession = { ...session, email };
      await this.saveSession(updatedSession);
      return updatedSession;
    }
  },

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await database.getUserById(userId);
    if (!user) {
      throw new Error('Użytkownik nie istnieje.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new Error('Aktualne hasło jest nieprawidłowe.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await database.updateUserPassword(userId, passwordHash);
  },

  async refreshUser(userId) {
    const user = await database.getUserById(userId);
    if (!user) return null;
    
    const userData = { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      premium_until: user.premium_until 
    };
    await this.saveSession(userData);
    return userData;
  }
};
