# 🦜 Polygot: AI-Powered language learning web app with sentence

> **Learn smarter, not harder.** Polygot generates custom sentence lists based on your specific interests using Google's Gemini AI.

*(Replace this image with a screenshot of your app's dashboard)*

## 📋 Project Overview

Polygot is a modern web application designed to help language learners build sentence relevant to *them*. Instead of static, pre-made lists, Polygot uses Artificial Intelligence to generate context-aware vocabulary cards.

**Key Features:**

* **AI Generation:** Create sentence lists for any topic (e.g., "Ordering Coffee", "NBA Terms", "Business Meetings") using Google Gemini.

* **Multi-language Support:** Supports various source and target languages (English, Korean, Japanese, French, etc.).

* **Interactive Learning:** Flashcard mode for memorization.

* **Quiz Mode:** Test your knowledge with interactive quizzes.

* **Local Storage:** Your progress is saved locally on your browser.

## 🚀 User Guide

Follow these steps to master your target language.

### 1. Initial Setup

Before you begin, you need to configure the AI.

1. Go to the **Settings** tab.

2. Enter your **Google Gemini API Key**. (You can get one for free from Google AI Studio).

3. (Optional) Toggle **Dark Mode** for a better viewing experience.

⠀
### 2. Build Your List

1. Navigate to the **Builder** tab.

2. **Topic:** Type what you want to learn about (e.g., *"Travel survival phrases"*).

3. **Language:** Select your Source Language and Target Language.

4. **Difficulty:** Choose from Beginner, Intermediate, or Advanced.

5. Click **Generate**. The AI will create a structured list for you.

⠀
### 3. Study & Quiz

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
├── context/      # Global state (PhraseContext)
├── hooks/        # Custom hooks (useLocalStorage, useTheme)
├── lib/          # AI logic and utilities
├── views/        # Main page layouts (Builder, Learn, Quiz)
└── types/        # TypeScript interfaces
```

### State Management (`src/context/PhraseContext.tsx`)

The app uses a central Context to manage the list of words and user interactions. Data persistence is handled via a custom `useLocalStorage` hook, ensuring data survives page reloads without a backend database.

### Installation & Run

```
# 1. Clone the repository
git clone [https://github.com/your-username/polygot-app.git](https://github.com/your-username/polygot-app.git)

# 2. Install dependencies
npm install

# 3. Start the development server
npm run-script dev
```

*Built with ❤️ by Kendrick Yun.*
