# Wykuj.ai

Wykuj.ai is a sophisticated AI-driven learning platform designed for mobile devices. It serves as an intelligent companion for students and professionals, enabling efficient management of study materials and interactive learning through advanced large language models.

## Core Functionality

### Project Management
The application allows users to organize their learning into distinct projects. Each project maintains its own set of materials, notes, and AI chat history, ensuring a structured approach to diverse subjects.

### Intelligent Material Processing
Wykuj.ai features a robust engine for local text extraction from various document formats. This allows the AI to "learn" directly from user-provided files without manual data entry.
Supported formats include:
- Portable Document Format (PDF)
- Microsoft Word (DOCX)
- Microsoft Excel (XLSX)
- Microsoft PowerPoint (PPTX)
- Plain Text (TXT)
- OpenDocument Formats (ODT, ODS, ODP)

### AI Synthesis and Interaction
Leveraging the Groq API, the application provides high-speed, context-aware responses. The AI can analyze uploaded materials to answer specific questions, generate summaries, or explain complex concepts within the context of the user's project.

## Technical Architecture

### Frontend Framework
- React Native with Expo SDK 54.
- High-performance UI components.
- NativeWind for consistent and scalable styling.

### Data Management
- Local Persistence: SQLite via expo-sqlite for secure, offline data storage.
- State Management: Zustand for efficient, reactive application state handling.

### Services and Processing
- AI Integration: Groq API utilizing Llama 3 architectures.
- Native Document Processing: Local binary parsing for maximum privacy and performance.

## Installation and Setup

### Prerequisites
- Node.js (LTS version recommended)
- Expo CLI
- iOS or Android development environment (Xcode or Android Studio)

### Configuration
Create a `.env` file in the root directory and provide your credentials:
```env
EXPO_PUBLIC_GROQ_API_KEY=your_api_key_here
```

### Development Execution
1. Install dependencies:
   ```bash
   npm install
   ```
2. For standard development:
   ```bash
   npx expo start
   ```
3. For native builds (required for PDF processing):
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

## Development and Contributions
The project follows a modular architecture within the `src/` directory:
- `components/`: Reusable UI elements and complex screen sections.
- `screens/`: Top-level navigation views.
- `store/`: Application state logic.
- `database/`: SQL schema and data access objects.
- `services/`: External API integrations.

## License
Private and confidential. All rights reserved.
