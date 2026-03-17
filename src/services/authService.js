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
  async register(email, password) {
    try {
      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        throw new Error('Użytkownik o takim adresie e-mail już istnieje.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const userId = await database.registerUser(email, passwordHash);
      const user = { id: userId, email };
      
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

      const userData = { id: user.id, email: user.email };
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
  }
};
