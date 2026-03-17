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
          temperature: 0.6,
        }),
      });

      if (response.status === 429) {
        throw new Error('Limit zapytań (Rate Limit) osiągnięty. Odczekaj 5-10 sekund i spróbuj ponownie.');
      }

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Wystąpił błąd AI.');
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Brak odpowiedzi od AI (pusty wynik).');

      return content;
    } catch (error) {
      console.error('Groq API Error:', error.message);
      throw error;
    }
  },

  async generateNotes(context, length = 'medium', model = CONFIG.MODELS.PRIMARY) {
    const prompt = `Na podstawie poniższych materiałów wygeneruj ${length} notatki w formacie Markdown. Skup się na najważniejszych informacjach.\n\nMaterialy:\n${context}`;

    return this.sendMessage([
      { role: 'system', content: 'Jesteś pomocnym asystentem naukowym.' },
      { role: 'user', content: prompt }
    ], model);
  },

  async generateFlashcards(context, existingCards = [], model = CONFIG.MODELS.PRIMARY) {
    const existingQuests = existingCards.map(c => `- ${c.question}`).join('\n');
    const existingPrompt = existingCards.length > 0
      ? `\n\nOto pytania, które JUŻ MAMY (NIE POWTARZAJ ICH):\n${existingQuests}`
      : '';

    const prompt = `Na podstawie materiałów wygeneruj 5-8 fiszek JSON (question, answer).${existingPrompt}\nZwróć TYLKO tablicę JSON, bez tekstu.\n\nMaterialy:\n${context}`;

    const response = await this.sendMessage([
      { role: 'system', content: 'Jesteś asystentem tworzącym fiszki JSON.' },
      { role: 'user', content: prompt }
    ], model);

    try {
      const jsonString = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse flashcards JSON:', error, response);
      // If it's already an error message we threw, pass it on
      if (response.startsWith('Limit') || response.startsWith('Wystąpił')) throw new Error(response);
      throw new Error('Nie udało się przetworzyć odpowiedzi AI na format JSON.');
    }
  },

  async generateQuiz(context, count = 5, model = CONFIG.MODELS.PRIMARY, options = {}) {
    const prompt = `Na podstawie materiałów wygeneruj ${count} pytań testowych JSON.\nKażde: "question", "options" (4), ${multichoice ? '"correct_answers" (tablica)' : '"correct_answer"'}.\nZwróć TYLKO JSON.\n\nMaterialy:\n${context}`;

    const response = await this.sendMessage([
      { role: 'system', content: 'Jesteś asystentem tworzącym quizy JSON.' },
      { role: 'user', content: prompt }
    ], model);

    try {
      const jsonString = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse quiz JSON:', error, response);
      throw new Error('Nie udało się przetworzyć quizu na format JSON.');
    }
  },

  async generateChatTitle(userMessage, aiResponse, model = CONFIG.MODELS.PRIMARY) {
    const prompt = `Stwórz bardzo krótki, maksymalnie 3-5 słowny tytuł dla rozmowy, na podstawie zapytania użytkownika: "${userMessage}", oraz odpowiedzi od AI: "${aiResponse}"
    
    Zwróć TYLKO tytuł w języku polskim, bez cudzysłowów, bez kropek, nic więcej.`;

    try {
      const response = await this.sendMessage([{ role: 'user', content: prompt }], model);
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
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Przepisz cały tekst ze zdjęcia. Tylko czysty tekst.' },
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

      if (response.status === 429) throw new Error('Limit Rate Limit osiągnięty. Odczekaj chwilę.');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Błąd OCR');
      return result.choices[0].message.content;
    } catch (error) {
      console.error('OCR error:', error);
      throw error;
    }
  },

  async generateStudyGuide(materialsContext, model = CONFIG.MODELS.PRIMARY) {
    try {
      const response = await fetch(GROQ_API_URL, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Jesteś ekspertem edukacyjnym. Zwróć odpowiedź w JSON:\n1. 'summary': (3 zdania).\n2. 'keyTerms': lista 5-8 pojęć z def.\n3. 'roadmap': 3-5 kroków.\n4. 'predictedQuestions': 3-5 pytań."
            },
            {
              role: "user",
              content: `Materiały:\n\n${materialsContext}`
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (response.status === 429) throw new Error('Limit Rate Limit osiągnięty. Odczekaj chwilę.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Błąd generowania planu nauki');

      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Brak odpowiedzi od AI.');

      return JSON.parse(content);
    } catch (error) {
      console.error("Study Guide error:", error);
      // Simplify error message for the user but keep the original logic if it's our thrown error
      if (error.message.includes('Limit')) throw error;
      throw new Error('Nie udało się wygenerować planu nauki w formacie JSON.');
    }
  }
};
