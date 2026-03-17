export const CONFIG = {
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY,
  MODELS: {
    LIGHT: 'llama-3.1-8b-instant',
    PRO: 'llama-3.3-70b-versatile',
    PRIMARY: 'llama-3.1-8b-instant', // Default model
  }
};
