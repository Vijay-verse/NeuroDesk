# 🧠 NeuroDesk – Smart Study & Mind Intelligence System

**NeuroDesk** is a premium, high-performance productivity suite designed to help you focus deeper, think clearer, and achieve more. Built with a modern React architecture and a futuristic glassmorphism aesthetic, it transforms your study habits into a supercharged intelligence journey.

![NeuroDesk Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## ⚡ Core Features

### ⚔️ Focus Battle
Enter the zone with our advanced Pomodoro system. 
- **Distraction Tracker**: Log and avoid distractions in real-time.
- **Focus Rings**: Visual progress tracking with animated circular timers.
- **Session Goals**: Set and hit daily focus targets.

### 🧠 Journal
Capture and connect your ideas in a modular knowledge environment.
- **Linked Notes**: Organize thoughts with dual-tagging and color-coding.
- **Knowledge Visualization**: (Coming Soon) Interactive graph view of your mental connections.
- **Fast Search**: Instant retrieval of your captured insights.

### 🌊 MindTrace
Track your emotional landscape and mental energy.
- **Mood Journaling**: Quick daily logs with emoji-based expression.
- **Energy Analytics**: Monitor your "batteries" to avoid burnout.
- **Reflection History**: Review your journey to build deeper self-awareness.

### 📅 Study Planner
Manage your subjects and deadlines with algorithmic precision.
- **Task Management**: Prioritize assignments (High/Medium/Low).
- **Subject Grouping**: Stay organized across multiple fields of study.
- **Progress Badges**: Real-time completion rates for your study tasks.

---

## 🛠️ Technology Stack

NeuroDesk leverages the latest web technologies for a smooth, premium experience:

- **Frontend**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with **Glassmorphism** & CSS Variables
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/) icons
- **Data Viz**: [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Backend**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM

---

## 🚀 Deployment Architecture

NeuroDesk uses a high-performance **decoupled deployment**:

- **Frontend**: Hosted on [Vercel](https://vercel.com/) for lightning-fast Edge delivery.
- **Backend**: Hosted on [Railway](https://railway.app/) for reliable persistent data handling.
- **Redirection**: Vercel acts as a transparent proxy, forwarding `/api` traffic directly to the Railway production backend.

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
    ```

4.  **Run Development Environment**:
    Open two terminals:
    - **Terminal 1 (Backend)**: `npm run server`
    - **Terminal 2 (Frontend)**: `npm run dev`

5.  **Visit App**:
    The app will be running at `http://localhost:5173/`.

---

## 🎨 Visual Identity
NeuroDesk features a sleek **Dark Mode** by default, utilizing a palette of deep purples, cyan-slates, and vibrant gradients. The interface is built on a glassmorphism design system that emphasizes depth, clarity, and focus.

---

## 📄 License
This project is licensed under the ISC License.

---

*“The secret of getting ahead is getting started.”* – **NeuroDesk Team**
