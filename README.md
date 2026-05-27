# 🐙 GitNest Visualizer & Simulator

GitNest is a highly immersive, interactive, and beautifully designed macOS-style Git graph visualizer and sandbox shell emulator. Modeled to demystify complex git branch workflows, GitNest allows developers to execute git commands and inspect visual graph railway tracks side-by-side with an integrated intelligent **Nest AI Assistant** powered by Gemini.

---

## ✨ Features

- **Interactive Railway Graph**: High-resolution interactive SVG railway paths rendering branch histories, commit timelines, merges, and head indicators.
- **Embedded Git Terminal Terminal**: Practice authentic Git commands (checkout, branch, status, rebase, merge, cherry-pick) in a live sandbox environment.
- **Advanced Git Workflows**: 
  - **Hunk/Line Staging**: Choose individual lines to stage and commit.
  - **Visual Merge Conflict Solver**: Line-by-line interactive resolver HUD for managing parallel code divergences.
  - **Cherry-Pick & Revert**: Seamlessly replay commits onto the current branch or undo changes safely with real-time UI tracking.
  - **Stash Management**: Create, pop, and inspect stashes with full visual representation.
- **Nest AI Assistant**: Built-in intelligent Git command strategist and automation advisor (driven by Gemini 3.5 Flash) to assist in planning tricky branch merges, resolving conflicts, and refining workflows.

---

## 🚀 Run Locally with Docker Compose (Recommended)

To build and launch GitNest immediately using Docker, execute:

```bash
docker-compose up --build
```

The container will build the app and spin up the Express production server.
- **Access URL**: Open [http://localhost:3000](http://localhost:3000) in your web browser.
- **AI Activation**: To leverage the intelligent Nest AI Assistant suggestions, create a `.env` file containing your key under `GEMINI_API_KEY`:
  ```env
  GEMINI_API_KEY=your_actual_gemini_api_key_here
  ```

---

## 🐳 Alternative Run: Standalone Docker

If you prefer operating with vanilla Docker CLI commands:

### 1. Build the Docker Image
```bash
docker build -t gitnest .
```

### 2. Run the Container
```bash
docker run -p 3000:3000 --env GEMINI_API_KEY="your_api_key_here" gitnest
```

---

## 🛠️ Setup for Manual Local Development

If you'd like to run or modify the source code locally on your workstation:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template variables file and enter your Gemini API Key if you wish to use the Nest AI assistance:
```bash
cp .env.example .env
```
Add your key inside `.env`:
```env
GEMINI_API_KEY=your_actual_key_here
```

### 3. Start Development Server
```bash
npm run dev
```
This launches Express on port `3000` executing the hot-rebuilding Vite React client under middleware. Go to [http://localhost:3000](http://localhost:3000).

### 4. Build & Run in Production
To test the fully compiled optimized bundles:
```bash
npm run build
npm run start
```

---

## 📂 Project Architecture

- `/src/App.tsx`: Central visual state registry and coordinate manager.
- `/src/components/GitGraph.tsx`: Core railway tracks rendering pipeline.
- `/src/components/Terminal.tsx`: Commands parsing tokenization controller.
- `/src/components/AiPanel.tsx`: Intelligent sidebar conversational advisor UI.
- `/server.ts`: Lightweight Express server proxy and asset middleware compiler.
- `/Dockerfile`: Minimal double-stage containerization blueprint.
- `/docker-compose.yml`: Simplified local orchestrator recipe.
