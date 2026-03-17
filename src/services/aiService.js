import { CONFIG } from '../config';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // Alias for GROQ_URL for vision model
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

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
  },

  async generateQuiz(context, count = 5) {
    const prompt = `Na podstawie poniższych materiałów wygeneruj ${count} pytań testowych wielokrotnego wyboru w formacie JSON. 
Każde pytanie musi mieć:
- "question": treść pytania
- "options": tablica 4 możliwych odpowiedzi (tekst)
- "correct_answer": poprawna odpowiedź (musi być dokładnie taka sama jak jedna z opcji)

Zwróć TYLKO czysty kod JSON jako tablicę obiektów, bez żadnego dodatkowego tekstu.\n\nMaterialy:\n${context}`;

    const response = await this.sendMessage([
      { role: 'system', content: 'Jesteś asystentem tworzącym quizy edukacyjne w formacie JSON.' },
      { role: 'user', content: prompt }
    ]);

    try {
      const jsonString = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse quiz JSON:', error, response);
      throw new Error('Nie udało się wygenerować quizu w poprawnym formacie.');
    }
  },

  async generateChatTitle(userMessage, aiResponse) {
    const prompt = `Stwórz bardzo krótki, maksymalnie 3-5 słowny tytuł dla rozmowy, na podstawie zapytania użytkownika: "${userMessage}", oraz odpowiedzi od AI: "${aiResponse}"
    
    Zwróć TYLKO tytuł w języku polskim, bez cudzysłowów, bez kropek, nic więcej.`;

    try {
      const response = await this.sendMessage([{ role: 'user', content: prompt }]);
      return response.trim().replace(/["']/g, '');
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Nowa rozmowa';
    }
  },

  async transcribeAudio(uri, filename = 'audio.m4a', mimeType = 'audio/m4a') {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'pl');
    formData.append('response_format', 'json');

    try {
      const response = await fetch(GROQ_AUDIO_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Błąd transkrypcji');
      return result.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Nie udało się zamienić nagrania na tekst.');
    }
  },

  async extractTextFromImage(base64Image) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Przepisz cały tekst z tego zdjęcia. Zwróć tylko czysty tekst, bez żadnych komentarzy.' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Błąd OCR');
      return result.choices[0].message.content;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Nie udało się wyciągnąć tekstu ze zdjęcia.');
    }
  },

  async generateStudyGuide(materialsContext) {
    try {
      const response = await fetch(GROQ_API_URL, { // Using GROQ_API_URL for chat completions
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Model specified in the original snippet
          messages: [
            {
              role: "system",
              content: "Jesteś ekspertem edukacyjnym. Na podstawie dostarczonych materiałów przygotuj profesjonalny 'Plan Nauki' (Study Guide). Odpowiedź MUSI być w formacie JSON i zawierać:\n1. 'summary': ogólne podsumowanie materiału (max 3-4 zdania).\n2. 'keyTerms': lista 5-8 kluczowych pojęć wraz z krótkimi definicjami.\n3. 'roadmap': lista 3-5 kroków jak najlepiej opanować ten materiał.\n4. 'predictedQuestions': 3-5 pytań, które mogą pojawić się na egzaminie/sprawdzianie."
            },
            {
              role: "user",
              content: `Oto materiały do analizy:\n\n${materialsContext}`
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Błąd generowania planu nauki');

      // The original snippet used response.choices[0].message.content, adapting to fetch response structure
      const jsonString = data.choices?.[0]?.message?.content;
      if (!jsonString) throw new Error('Brak odpowiedzi od AI (pusty wynik) dla planu nauki.');

      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Study Guide Generation Error:", error);
      throw new Error('Nie udało się wygenerować planu nauki w poprawnym formacie.');
    }
  }
};
