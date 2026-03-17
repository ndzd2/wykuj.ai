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
  },

  async generateFlashcards(context, existingCards = []) {
    const existingQuests = existingCards.map(c => `- ${c.question}`).join('\n');
    const existingPrompt = existingCards.length > 0 
      ? `\n\nOto pytania, które JUŻ MAMY (NIE POWTARZAJ ICH):\n${existingQuests}` 
      : '';

    const prompt = `Na podstawie poniższych materiałów wygeneruj 5-10 NOWYCH fiszek naukowych w formacie JSON. 
Każda fiszka musi mieć pola "question" (pytanie/pojęcie) oraz "answer" (odpowiedź/definicja).${existingPrompt}
Zwróć TYLKO czysty kod JSON jako tablicę obiektów, bez żadnego dodatkowego tekstu czy formatowania markdown.\n\nMaterialy:\n${context}`;

    const response = await this.sendMessage([
      { role: 'system', content: 'Jesteś asystentem tworzącym materiały do nauki w formacie JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      // Clean potential markdown code blocks if the AI included them
      const jsonString = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse flashcards JSON:', error, response);
      throw new Error('Nie udało się wygenerować fiszek w poprawnym formacie.');
    }
  }
};
