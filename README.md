# 🦜 Polyglot: AI-Powered language learning web app

> **Learn smarter, not harder.** Polyglot generates custom sentence lists based on your specific interests using Google's Gemini AI.



## 📋 Project Overview

Polyglot is a modern web application designed to help language learners build sentences relevant to *them*. Instead of static, pre-made lists, Polyglot uses Artificial Intelligence to generate context-aware vocabulary cards and learns from your favorite music.

**Key Features:**

* **AI Generation:** Create sentence lists for any topic (e.g., "Ordering Coffee", "NBA Terms", "Business Meetings") using Google Gemini.

* **Music Mode:** Learn languages through your favorite songs. Get AI-generated lyrics, translations, and vocabulary from music videos.

* **Smart Dashboard:** Daily missions, progress tracking, and personalized recommendations.

* **Multi-language Support:** Supports various source and target languages (English, Korean, Japanese, French, etc.).

* **Interactive Learning:** Flashcard mode for memorization.

* **Quiz Mode:** Test your knowledge with interactive quizzes.

* **IndexedDB Storage:** Your progress is saved locally and synced to the cloud.

## 🚀 User Guide

Follow these steps to master your target language.

### 1. Initial Setup

Before you begin, you need to configure the AI.

1. Go to the **Settings** tab.
2. Enter your **Google Gemini API Key**. (You can get one for free from Google AI Studio).
3. (Optional) Toggle **Dark Mode** for a better viewing experience.

### 2. Daily Learning

* **Home:** Check your "Daily Missions" and "Today's Picks" for quick study sessions.
* **Music:** Search for a song to get instant lyrics and generated vocabulary.

### 3. Build Your List

1. Navigate to the **Builder** tab.
2. **Topic:** Type what you want to learn about (e.g., *"Travel survival phrases"*).
3. **Language:** Select your Source Language and Target Language.
4. **Difficulty:** Choose from Beginner, Intermediate, or Advanced.
5. Click **Generate**. The AI will create a structured list for you.

### 4. Study & Quiz

* **Learn:** Use the **Learn** tab to view flashcards. Click a card to flip it and reveal the meaning and pronunciation.
* **Quiz:** Go to the **Quiz** tab to test your recall. The app tracks your score instantly.

## 💻 Developer Guide

This section explains the technical structure for contributors or developers who want to understand the codebase.

### Tech Stack

* **Framework:** React (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **AI Integration:** Google Generative AI SDK (Gemini)
* **State Management:** React Context API

### Project Structure

The project follows a clean, feature-based architecture:

```
src/
├── components/   # Reusable UI components (Modals, Buttons)
├── context/      # Global state (PhraseContext, MusicContext)
├── hooks/        # Custom hooks (useCloudStorage, useTheme)
├── lib/          # AI logic and utilities
├── data/         # Starter phrase dictionaries
├── constants/    # App constants and configuration
├── views/        # Main page layouts (Builder, Learn, Quiz)
└── types/        # TypeScript interfaces
```

### State Management (`src/context/PhraseContext.tsx`)

The app uses a central Context to manage the list of words and user interactions. Data persistence uses an offline-first strategy: `useCloudStorage` hook syncs IndexedDB with Firebase for cross-device access while maintaining offline functionality.

### Installation & Run

```
# 1. Clone the repository
git clone https://github.com/yyc9920/polyglot-app.git

# 2. Install dependencies
pnpm install

# 3. Start the development server
pnpm dev
```

*Built with ❤️ by Kendrick Yun.*
