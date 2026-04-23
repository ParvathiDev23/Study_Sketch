<div align="center">
  <img src="https://i.imgur.com/KkU9Z2Q.png" alt="StudySketch Mascot" width="120" style="margin-bottom: 20px; animation: float 3s ease-in-out infinite;" />
  <h1>✏️ StudySketch</h1>
  <p><em>Study Smarter, Sketch Your Success! ✨</em></p>
  <p>
    <a href="https://github.com/ParvathiDev23/Study_Sketch"><img src="https://img.shields.io/badge/Status-Complete-success.svg?style=flat-square" alt="Status" /></a>
    <a href="#"><img src="https://img.shields.io/badge/React-18.x-61dafb.svg?style=flat-square&logo=react" alt="React" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Firebase-v10-FFCA28.svg?style=flat-square&logo=firebase" alt="Firebase" /></a>
    <a href="#"><img src="https://img.shields.io/badge/AI-Google_Gemini-8E24AA.svg?style=flat-square" alt="Gemini" /></a>
  </p>
</div>

<br />

Welcome to **StudySketch**! Stop dragging yourself through boring flashcard apps. StudySketch is a highly interactive, beautifully animated **pencil-sketch themed** study companion. It brings the tactile feel of doodling in a notebook right to your browser screen!

## 🌟 Key Features

*   **📝 Doodle-Style UI:** Wobbly sticker cards, glowing pencil strokes, and bouncy hover interactions. It feels alive!
*   **🤖 AI Study Plans:** Upload your notes (via text/PDF) and the integrated **Google Gemini API** instantly sketches out a logical, broken-down topic list for your exams.
*   **⏱️ Pomodoro Timer:** Stay focused using time management techniques built right in.
*   **📋 To-Do Tracking:** Interactive priority tasks with a comprehensive visual progress ring.
*   **📈 PDF Reports:** Keep track of your daily study streaks, generated beautifully in a raw bar-chart overview, completely exportable to PDF documents.
*   **🌙 Deep Dark Mode:** Don't burn your eyes studying at night! Seamlessly switch to the sleek dark charcoal graphite theme.
*   **📲 Installable (PWA):** Study anywhere by installing it directly to your mobile or desktop app drawer.

<br />

## 🛠️ Technology Stack

*   **Frontend:** React (Vite), Vanilla CSS (Custom Keyframe Animations)
*   **Backend / DB:** Firebase Auth & Firestore
*   **AI Integration:** Google Gemini (Generative AI)

<br />

## 🚀 Getting Started

Follow these instructions to run the application locally on your machine.

### Prerequisites
*   [Node.js](https://nodejs.org/en/) installed on your machine
*   A [Firebase](https://firebase.google.com/) Project for Firestore & Auth
*   A [Google Gemini API Key](https://aistudio.google.com/app/apikey) for the AI assistant

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ParvathiDev23/Study_Sketch.git
   cd Study_Sketch
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase Env Variables:**
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Spin up the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view it in the browser.

<br />

## 💡 How to Use the AI Planner
Studying for a huge exam? Simply set your personalized Gemini API key within the profile/app modal initially, drag your study material or drop raw text, and let StudySketch map out the perfect bite-sized topics for you to tick off dynamically!

<br />

## 🎨 Inspiration
The beautiful wobbly UI blocks and dynamic hover states draw heavy layout and interaction inspiration from organic, physically cut "sticker" designs seen in modern interactive digital art pieces (like *itsnotviolent.com*).

---
<div align="center">
  <p>Built with ❤️ and plenty of coffee for students everywhere.</p>
</div>
