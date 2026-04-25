# 🧠 NeuroDesk – Premium Study & Mind Intelligence System

**NeuroDesk** is a premium, high-performance productivity suite designed to help you focus deeper, think clearer, and achieve more. Built with a modern React architecture and a luxurious glassmorphism aesthetic, it turns your daily productivity into a habit-forming, supercharged intelligence journey.

![NeuroDesk Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## ⚡ Core Features

### 🎨 Advanced Theme Engine
- **Three Modes**: Switch effortlessly between **Dark** (deep space), **Light** (clean minimal), and **Purple** (lavender gradient) themes.
- **Glassmorphism**: Premium frosted-glass UI with smooth 0.5s CSS variable transitions.

### 📊 Smart Dashboard
Your daily command center for total accountability.
- **Dynamic Greeting**: Time-aware greetings and real-time clock.
- **Quick Tasks & Mood**: Manage immediate todos and log your daily emotional state.
- **Activity Feed**: View focus history and quick notes at a glance.

### ⚔️ Gamified Focus Battle
Enter the zone with our advanced Pomodoro system designed to build habits.
- **XP & Levels**: Earn XP for focusing and level up your mind intelligence.
- **Achievements**: Unlock 12 beautifully designed badges based on your performance.
- **Distraction Tracker**: Tab-switch detection penalizes XP to keep you accountable.
- **Streaks**: Build and maintain your daily 🔥 focus streak.

### 🧠 Journal (Second Brain)
Capture and connect your ideas in a modular knowledge environment.
- **Linked Notes**: Organize thoughts with dual-tagging and responsive filtering.
- **Instant Search**: Find any insight instantly across your knowledge base.
- **Offline First**: Robust `localStorage` fallback ensures you never lose a note.

### 📈 Deep Analytics
Visualize your growth and stay accountable to your goals.
- **Interactive Charts**: Daily focus time (Bar) and weekly progression (Line) charts.
- **Performance Metrics**: View averages, totals, and XP milestones.
- **Streak Calendar**: GitHub-style 28-day contribution grid.

### 🤖 AI Assistant (Powered by Groq)
Your lightning-fast, intelligent on-demand study companion.
- **Groq API**: Powered by Llama 3.3 70B via Groq for ultra-low latency inference.
- **Model Fallback Chain**: Automatically shifts to secondary models (Llama 3.1 8B, Gemma 2 9B) to guarantee uptime.
- **Smart Offline Support**: If the API is unreachable (or in PWA offline mode), instantly switches to a built-in encyclopedia of study techniques and Pomodoro tips.
- **Interactive Chat**: ChatGPT-like UI with markdown rendering and persistent message history.

### 🧰 Productivity Utilities
All your tools in one unified dashboard.
- **To-Do List**: Priority-based task tracking with completion states.
- **Mini Calendar**: Quick month-at-a-glance navigation.
- **Live Weather**: Geolocation-based real-time weather from wttr.in.
- **Sticky Notes**: Color-coded quick scrappads.

### 📱 Progressive Web App (PWA)
NeuroDesk is a fully installable app that works anywhere.
- **Installable**: Install directly to your desktop or mobile home screen natively from the browser.
- **Offline Mode**: A custom Service Worker caches the app shell. You can view the dashboard, log journal entries, and track focus sessions completely offline. Data syncs locally.
- **Connection Awareness**: Beautiful UI banners instantly notify you when your network drops or reconnects.

---

## 🛠️ Technology Stack

NeuroDesk leverages the latest web technologies for a smooth, premium experience:

- **Frontend**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with **Glassmorphism** & advanced CSS Variables
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/) icons
- **Data Viz**: [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **AI Integration**: [Groq API](https://groq.com/) (Llama 3.3 70B)
- **Offline & Desktop**: Progressive Web App (PWA) via Service Workers
- **Data Persistence**: Robust `localStorage` caching with backend sync capabilities
- **Backend**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM

---

## 🚀 Deployment Architecture

NeuroDesk uses a high-performance **decoupled deployment**:

- **Frontend**: Hosted on [Vercel](https://vercel.com/) for lightning-fast Edge delivery.
- **Backend / Sync**: Hosted on [Railway](https://railway.app/) for reliable persistent data handling.
- **Redirection**: Vercel acts as a transparent proxy, forwarding API traffic directly to the Railway production backend.

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a local MongoDB instance

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Vijay-verse/NeuroDesk.git
    cd NeuroDesk
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file in the root:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    PORT=5000
    VITE_GROQ_API_KEY=your_groq_api_key_here
    ```

4.  **Run Development Environment**:
    Open two terminals:
    - **Terminal 1 (Backend)**: `npm run server`
    - **Terminal 2 (Frontend)**: `npm run dev`

5.  **Visit App**:
    The app will be running at `http://localhost:5173/`.

---

## 📄 License
This project is licensed under the ISC License.

---

*“The secret of getting ahead is getting started.”* – **NeuroDesk Team**
