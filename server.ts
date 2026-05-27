import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increase for full diff payloads
  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client (lazy-initialized inside route to avoid crashing the server if missing)
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error('GEMINI_API_KEY is not configured in environment variables.');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // API endpoint for GitNest AI Assistant
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      let client: GoogleGenAI;
      try {
        client = getGeminiClient();
      } catch (err: any) {
        console.warn('Gemini Client Init Warning:', err.message);
        res.status(200).json({
          text: `### ⚠️ Gemini API Key Missing\n\nI'm ready to act as your **Nest AI Assistant**! However, the \`GEMINI_API_KEY\` is not currently configured in the environment variables.\n\n**To enable full AI support, follow these simple steps:**\n1. Open the **Secrets / Keys Panel** in the AI Studio editor wrapper.\n2. Add a new secret with the name \`GEMINI_API_KEY\` and paste your Gemini API Key.\n3. The development server will load it automatically.\n\n**In the meantime, feel free to use standard git visual commands and mock stashes!**`
        });
        return;
      }

      const systemInstruction = `You are "Nest AI", a world-class Git command strategist, developer advisor, and automation engine integrated directly inside GitNest.
Your role is to guide developers on solving complex Branch structures, resolving merge conflicts, planning merges, and writing commits.

Guidelines:
1. Speak clearly, concisely, and with encouraging developer composure.
2. Provide precise, copyable or single-click executable git commands (styled in code blocks, e.g. \`git merge feature/auth\`).
3. If they ask about resolving a conflict, write down the conceptual explanation of what each side of the conflict is, and suggest terminal commands.
4. When writing code snippets, specify the exact files.

Here is some live metadata about their current active state in GitNest:
- Active branch: ${context?.activeBranchName || 'unknown'}
- Available branches: ${context?.branches ? Object.keys(context.branches).join(', ') : 'unknown'}
- Current Conflicts: ${context?.conflicts ? JSON.stringify(Object.keys(context.conflicts)) : 'None'}
- Stash count: ${context?.stashes ? context.stashes.length : 0}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text || 'No response returned from the model.' });
    } catch (error: any) {
      console.error('Gemini Proxy Error:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate response due to internal proxy error.' });
    }
  });

  // Hotfix API utility to simulate git clone or mock fetch
  app.get('/api/git/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Setup Vite middleware for development, static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GitNest server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
