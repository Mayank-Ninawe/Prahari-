# Prahari AI 🛡️ — Real-Time Deadline Rescue System

> **Prahari (प्रहरी)** • *Noun (Sanskrit)*: A guard, watchman, or sentinel who keeps vigil to avert danger.

Prahari AI is a high-urgency, intelligent sentinel system built to help creators, students, and engineers salvage compromised deadlines through real-time risk evaluation, generative tactical rescue plans, automated scope compression, and lock-screen focus shields.

---

## 🎯 The Problem: The Procrastination-Crisis Gap
Standard task managers and todo lists are passive catalogs. They display your tasks but do nothing when you slip into crisis mode, lose track of time, or face an imminent deadline breach. When a deadline is hours away and the pending workload exceeds the remaining hours, panic sets in, leading to:
- **Decision Paralysis**: Not knowing where to start.
- **Scope Bloat**: Attempting to complete unnecessary feature details while core items fail.
- **Distraction Loops**: Falling prey to notifications and tabs instead of focusing.

Prahari AI solves this by active monitoring and intervention, acting as an **Emergency Response System for your work**.

---

## ⚡ The Solution: The Prahari Rescue Workflow
Prahari AI transforms your workspace into an active-sentinel operational command center:

1. **Active Sentinel (Risk Engine)**: Calculates continuous danger scores (0–100) based on complexity, safety buffers, priority, and remaining hours.
2. **Generative Tactical Rescue (Gemini 2.5)**: When a target slips into high danger levels, Gemini is invoked using strict JSON output to generate a bespoke, low-overhead survival checklist.
3. **AI Scope Compression**: With one click, Prahari can automatically prune non-essential steps, recalculate remaining milestones, and retrieve lost safety hours.
4. **Workspace Focus Shields**: Locks down digital workspaces using fullscreen countdown displays, dark ambient white-noise synths, and distraction shields.
5. **Real-time Web Push Warnings**: Integrates localized web notifications to dispatch instant, high-urgency rescue alerts directly onto the user's browser screen before deadlines breach.

---

## ⚙️ Tech Stack & Architecture
Prahari AI is constructed as a secure, fast, enterprise-ready full-stack application:

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (for Swiss-Modern, high-contrast, eye-safe styling), and Lucide Icons.
- **Durable Persistence**: Google Cloud Firestore (real-time synchronized subcollections for user workspace targets, tactical plans, and escalation notification history).
- **AI Core**: Google Gemini 2.5 models utilizing structured JSON schema constraints via `@google/genai` to guarantee compile-safe plans.
- **State Security**: Firebase Authentication for secure user roles and custom work-style preference profiles.
- **Alert Dispatcher**: Local Browser Web Notification APIs and background audio context synthesizers.

---

## 🧪 Hackathon Demonstration & Evaluation Guide
We have built an interactive **Judge & Demo Sandbox** at the top of the Operational Command Center (Dashboard) to allow evaluators to immediately experience the system's core features without manual setup.

### Seeding Simulation Scenarios
Click **"Seed Sandbox Targets"** inside the sandbox widget on the Dashboard to populate three pre-configured real-time Firestore simulation scenarios:

1. **CS301 Compiler Project (Critical Standby)**:
   - *The Scenario*: Due in 6 hours, 240 minutes of complex parser coding remaining, zero tests.
   - *Evaluation Step*: Go to the **Rescue Page**, select this target. Observe the **Risk Score (94/100)**. Click **"Deploy Rescue Plan"** to watch Gemini generate an instant 4-step survival path focusing on lexical ANTLR grammar instead of compiler optimization passes.
2. **SaaS Product Pitch Slides (Compression Recommended)**:
   - *The Scenario*: Due in 45 minutes, 5 milestones remain totaling 60 estimated minutes. The workload exceeds the available time.
   - *Evaluation Step*: Select this task. The system detects the deadline breach and alerts you with an **"AI Compression Recommended"** banner. Click **"AI Scope Compression"** to watch the system compress slides from 12 down to 5, defer video recordings, and regain a 15-minute safety buffer.
3. **Prahari AI Final Pitch (Active Rescue Mode)**:
   - *The Scenario*: Already activated, 2/4 steps completed, focus timers running, countdown active.
   - *Evaluation Step*: Click **"Trigger Mitigation"** or go to the active checklist. Click **"Lock Focus Shields"** to enter the immersive fullscreen environment and experience the sensory ambient sound synthesis loop.

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm package manager

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/prahari-ai.git
   cd prahari-ai
   ```

2. **Install core dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and declare your secret keys:
   ```env
   # API access key for Gemini 2.5 structured output (server-safe)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Verify Linter and Build**:
   ```bash
   npm run lint
   npm run build
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the Operational Command Center.

---

## 📋 Evaluation Quality Checklist
- **Real Firestore Storage**: All tasks, custom plans, completed items, and notifications are securely synchronized in active Firestore subcollections. Clearing browser cache does not result in loss of user effort.
- **Type-Safe Compilation**: Strict TypeScript compilation with no implicit `any` blocks or loose type definitions.
- **Safe Fallbacks**: If the `GEMINI_API_KEY` is missing or the database is unprovisioned, the system degrades gracefully into localized rule-based heuristics with helpful warning labels instead of crashing.
- **Desktop & Mobile Responsive**: Visual components use responsive fluid grids and touch targets exceeding 44px to accommodate tablet or phone screens.

---
*Created with care for the AI Studio Hackathon. May your focus stay locked, and your deadlines remain secure.* 🛡️
