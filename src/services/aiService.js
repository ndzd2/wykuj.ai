import { CONFIG } from '../config';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const aiService = {
  async sendMessage(messages, model = CONFIG.MODELS.PRIMARY) {
    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      console.log('Groq API Response:', JSON.stringify(data));
      
      if (data.error) {
        return `Błąd AI: ${data.error.message || 'Nieznany błąd'}`;
      }
      
      return data.choices?.[0]?.message?.content || 'Brak odpowiedzi od AI (pusty wynik).';
    } catch (error) {
      console.error('Groq API Error details:', error);
      return 'Błąd połączenia z AI. Sprawdź internet.';
    }
  },

  async generateNotes(context, length = 'medium') {
    const prompt = `Na podstawie poniższych materiałów wygeneruj ${length} notatki w formacie Markdown. Skup się na najważniejszych informacjach.\n\nMaterialy:\n${context}`;
    
    return this.sendMessage([
      { role: 'system', content: 'Jesteś pomocnym asystentem naukowym.' },
      { role: 'user', content: prompt }
    ]);
  }
};
