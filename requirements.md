# Requirements

## Requirements for handleAiGenerate in BuilderView.tsx

### 1. Modify system prompt

The system prompt should be modified based on the following instructions:
Note that this is just example for japanese language. The final prompt will be different for desired language.

```plaintext
Act like a function that generates a Japanese phrase with a given situation or context.
Input: Curtain situation or context, number of output data.
Output: Corresponding Japanese phrases with given format. Generate a given number of datas.
Format: CSV in markdown, newline in end of each rows
Columns: Meaning,Sentence,Pronunciation,Tags
Contents:
Meaning: Korean translation
Sentence: Japanese sentence
Pronunciation: Romaji
Tags: Tags in Korean such as "일상,회사,식당“. Can be multiple tags separated by comma. ”일본어“ is default tag. If tags are given add that tags after default tag.
Enclose each data point in double quotation marks(“”).
Format example
"따뜻한 아메리카노 한 잔 주세요","ホットコーヒーを一つください","Hotto kōhī o hitotsu kudasai","카페,주문,일본어"
"메뉴판 좀 보여주시겠어요?","メニューを見せていただけますか？","Menyū o misete itadakemasu ka?","카페,주문,일본어"
Make sure that there isn't format error.
```

### 2. Make it work

This feature is not working as expected yet.

Please make it work as expected.

## Requirements for SettingsView.tsx

### 1. Learning Progress Dashboard

* **Visual Statistics:** Displays the overall learning progress as a percentage.
* **Detailed Counts:** Shows the specific number of words **Completed** versus words **To Review** (incorrect items).
* **Progress Bar:** A visual bar indicating the ratio of completed items against the total vocabulary count.

### 2. AI Configuration (Gemini API)

* **API Key Management:** Provides a secure input field (`type="password"`) for users to enter their own **Google Gemini API Key**.
* **Local Storage:** Implements logic to save the key locally in the browser (`localStorage`), enabling AI features like the "AI Vocabulary Generator" and "AI Tutor" without server-side storage.

### 3. Text-to-Speech (TTS) Settings

* **Voice Selection:** Allows users to select a specific voice engine from the browser's available options (essential for learning correct pronunciation in Japanese or Portuguese).
* **Search Functionality:** Includes a search bar to filter the list of system voices by name or language code (e.g., "en-US", "ja-JP"), addressing the issue of finding a specific voice among many installed options.
* **Automatically choose a voice via Tag:** Automatically set a voice if there are specific languages in the vocabulary list's tag (e.g., "Japanese" or "일본어" => "ja-JP").

### 4. Data Management

* **Reset Progress:** A function to clear only the learning history (completed/incorrect status) while preserving the stored vocabulary list.
* **Delete All Data:** A "Hard Reset" function that wipes all data, including the vocabulary list and settings, returning the app to its initial state.


## Other Requirements

* **Get csv data from saved url when reloaded:** The CSV data should be retrieved from the saved URL when the app is reloaded.
* **Save the status of LearnView and QuizView:** The status of LearnView and QuizView should be saved to localStorage and restored when user came back to LearnView or QuizView after using another features.
* **Save TTS Settings:** The TTS settings (voice selection) should be saved to localStorage and restored.
