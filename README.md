# wykuj.ai

wykuj.ai to zaawansowana platforma edukacyjna oparta na sztucznej inteligencji, stworzona z myślą o urządzeniach mobilnych. Aplikacja stanowi inteligentnego asystenta dla studentów i profesjonalistów, umożliwiając efektywne zarządzanie materiałami dydaktycznymi oraz interaktywną naukę przy wykorzystaniu wielkoformatowych modeli językowych.

## Kluczowe Funkcjonalności

### Zarządzanie Projektami
Aplikacja pozwala na organizację nauki w ramach oddzielnych projektów. Każdy projekt posiada własną bazę materiałów, notatek oraz historię interakcji z AI, co zapewnia strukturalne podejście do wielu dziedzin nauki jednocześnie.

### Bezpieczeństwo i Konta Użytkowników
Aplikacja posiada wbudowany system lokalnej autoryzacji (rejestracja i logowanie). Wszystkie dane (projekty, materiały, historia) są przypisane do konkretnego konta użytkownika, co pozwala na współdzielenie urządzenia przez wiele osób z zachowaniem pełnej prywatności danych.

### Inteligentne Przetwarzanie Materiałów
wykuj.ai posiada wbudowany silnik do lokalnej ekstrakcji tekstu z różnorodnych formatów dokumentów. Pozwala to sztucznej inteligencji na bezpośrednią naukę z plików dostarczonych przez użytkownika, eliminując konieczność ręcznego wprowadzania danych.
Obsługiwane formaty:
- Portable Document Format (PDF)
- Microsoft Word (DOCX)
- Microsoft Excel (XLSX)
- Microsoft PowerPoint (PPTX)
- Pliki tekstowe (TXT)
- Formaty OpenDocument (ODT, ODS, ODP)

### Centrum Nauki
Aplikacja oferuje zaawansowany system nauki oparty na materiałach generowanych przez sztuczną inteligencję.
- **Fiszki AI**: Automatyczne tworzenie zestawów pytań/odpowiedzi z inteligentnym unikaniem powtórek i statusem opanowania ("umiane").
- **Quizy AI**: Interaktywne testy wielokrotnego wyboru z możliwością wyboru długości (Krótki - 5, Średni - 10, Długi - 20 pytań).
- **Historia Wyników**: Każdy wygenerowany quiz jest zapisywany, co pozwala na śledzenie postępów i przeglądanie błędnych odpowiedzi.

### Eksport i Udostępnianie
wykuj.ai pozwala na łatwe dzielenie się wiedzą poza aplikacją:
- **Eksport do PDF**: Generowanie profesjonalnych, gotowych do wydruku dokumentów z quizami i kluczami odpowiedzi.
- **Eksport Markdown**: Szybkie udostępnianie treści quizów i notatek w formacie tekstowym.

### Synteza i Interakcja AI
Dzięki integracji z API Groq, aplikacja zapewnia błyskawiczne i kontekstowe odpowiedzi. AI analizuje wgrane materiały, aby odpowiadać na pytania, generować streszczenia lub wyjaśniać złożone zagadnienia w oparciu o kontekst danego projektu.

## Architektura Techniczna

### Framework Frontendowy
- React Native z wykorzystaniem Expo SDK 54.
- Zoptymalizowane komponenty interfejsu użytkownika.
- Stylizacja przy użyciu NativeWind (Tailwind CSS dla React Native).

### Zarządzanie Danymi i Bezpieczeństwo
- **Persystencja lokalna**: SQLite (expo-sqlite) zapewniający bezpieczne i szybkie przechowywanie danych offline.
- **Autoryzacja**: Lokalne hashowanie haseł przy użyciu biblioteki `bcryptjs` oraz `expo-crypto` dla zapewnienia najwyższych standardów bezpieczeństwa.
- **Bezpieczne przechowywanie**: Wykorzystanie `expo-secure-store` do zarządzania sesjami użytkownika.
- **Zarządzanie stanem**: Zustand dla wydajnej i reaktywnej obsługi logiki aplikacji.

### Usługi i Przetwarzanie
- Integracja AI: API Groq wykorzystujące modele z rodziny Llama 3.
- Przetwarzanie dokumentów: Lokalne parsowanie binarne w celu zapewnienia maksymalnej prywatności i wydajności.
- Generowanie raportów: `expo-print` oraz `expo-sharing` do tworzenia i udostępniania plików PDF.

## Instalacja i Konfiguracja

### Wymagania wstępne
- Node.js (zalecana wersja LTS)
- Expo CLI
- Środowisko programistyczne iOS lub Android (Xcode lub Android Studio)

### Konfiguracja
Należy utworzyć plik `.env` w katalogu głównym projektu i uzupełnić dane dostępowe:
```env
EXPO_PUBLIC_GROQ_API_KEY=twoj_klucz_api
```

### Uruchomienie deweloperskie
1. Instalacja zależności:
   ```bash
   npm install
   ```
2. Standardowe uruchomienie:
   ```bash
   npx expo start
   ```
3. Budowanie natywne (wymagane dla pełnej obsługi PDF):
   ```bash
   npx expo run:ios
   # lub
   npx expo run:android
   ```

## Struktura Projektu
Projekt opiera się na modułowej architekturze wewnątrz katalogu `src/`:
- `components/`: Komponenty UI i złożone sekcje ekranów.
- `screens/`: Główne widoki nawigacyjne.
- `store/`: Logika stanu aplikacji.
- `database/`: Schematy SQL i obiekty dostępu do danych (DAO).
- `services/`: Integracje z zewnętrznymi API.

## Licencja
Projekt prywatny. Wszystkie prawa zastrzeżone. Szczegóły znajdują się w pliku [LICENSE](LICENSE).
