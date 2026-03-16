# Wykuj.ai

Wykuj.ai to zaawansowana platforma edukacyjna oparta na sztucznej inteligencji, stworzona z myślą o urządzeniach mobilnych. Aplikacja stanowi inteligentnego asystenta dla studentów i profesjonalistów, umożliwiając efektywne zarządzanie materiałami dydaktycznymi oraz interaktywną naukę przy wykorzystaniu wielkoformatowych modeli językowych.

## Kluczowe Funkcjonalności

### Zarządzanie Projektami
Aplikacja pozwala na organizację nauki w ramach oddzielnych projektów. Każdy projekt posiada własną bazę materiałów, notatek oraz historię interakcji z AI, co zapewnia strukturalne podejście do wielu dziedzin nauki jednocześnie.

### Inteligentne Przetwarzanie Materiałów
Wykuj.ai posiada wbudowany silnik do lokalnej ekstrakcji tekstu z różnorodnych formatów dokumentów. Pozwala to sztucznej inteligencji na bezpośrednią naukę z plików dostarczonych przez użytkownika, eliminując konieczność ręcznego wprowadzania danych.
Obsługiwane formaty:
- Portable Document Format (PDF)
- Microsoft Word (DOCX)
- Microsoft Excel (XLSX)
- Microsoft PowerPoint (PPTX)
- Pliki tekstowe (TXT)
- Formaty OpenDocument (ODT, ODS, ODP)

### Synteza i Interakcja AI
Dzięki integracji z API Groq, aplikacja zapewnia błyskawiczne i kontekstowe odpowiedzi. AI analizuje wgrane materiały, aby odpowiadać na pytania, generować streszczenia lub wyjaśniać złożone zagadnienia w oparciu o kontekst danego projektu.

## Architektura Techniczna

### Framework Frontendowy
- React Native z wykorzystaniem Expo SDK 54.
- Zoptymalizowane komponenty interfejsu użytkownika.
- Stylizacja przy użyciu NativeWind (Tailwind CSS dla React Native).

### Zarządzanie Danymi
- Persystencja lokalna: SQLite (expo-sqlite) zapewniający bezpieczne i szybkie przechowywanie danych offline.
- Zarządzanie stanem: Zustand dla wydajnej i reaktywnej obsługi logiki aplikacji.

### Usługi i Przetwarzanie
- Integracja AI: API Groq wykorzystujące modele z rodziny Llama 3.
- Przetwarzanie dokumentów: Lokalne parsowanie binarne w celu zapewnienia maksymalnej prywatności i wydajności.

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
