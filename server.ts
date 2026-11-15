import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  ARTIFACTS,
  DESTINATIONS,
  STRICT_REFUSAL_MESSAGE,
  isSpaceTopicQuery,
  buildLocalExplorerGuideAnswer,
  type DestinationId,
} from './src/data/spaceData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health & API endpoint for Space Explorer AI Chatbot
  app.post('/api/explorer-guide', async (req, res) => {
    try {
      const {
        question = '',
        destinationId,
        artifactId,
        history = [],
      }: {
        question?: string;
        destinationId?: DestinationId;
        artifactId?: string;
        history?: Array<{ role: 'user' | 'assistant'; text: string }>;
      } = req.body || {};

      const trimmedQuestion = String(question).trim();
      if (!trimmedQuestion) {
        res.status(400).json({ error: 'Question is required.' });
        return;
      }

      const lastUserTopic = Array.isArray(history)
        ? [...history].reverse().find((m) => m.role === 'user')?.text
        : undefined;

      const isFollowUpMore =
        /\b(more|detail|details|explain further|elaborate|tell me more|continue|why)\b/i.test(
          trimmedQuestion
        ) && Boolean(lastUserTopic);

      // 1. Space & astronomy topic pre-check: politely redirect non-space topics
      if (!isSpaceTopicQuery(trimmedQuestion) && !isFollowUpMore) {
        res.json({
          reply: STRICT_REFUSAL_MESSAGE,
          sources: [],
          relatedArtifacts: [],
          isRefusal: true,
        });
        return;
      }

      // Gather current context for grounding
      const selectedDest = DESTINATIONS.find((d) => d.id === destinationId) || DESTINATIONS[0];
      const selectedArtifact = artifactId
        ? ARTIFACTS.find((a) => a.id === artifactId)
        : undefined;
      const localFallback = buildLocalExplorerGuideAnswer(trimmedQuestion, {
        destinationId,
        artifactId,
        lastTopicText: lastUserTopic,
      });

      const apiKey = process.env.GEMINI_API_KEY;
      const hasValidKey =
        Boolean(apiKey) &&
        apiKey !== 'MY_GEMINI_API_KEY' &&
        apiKey !== 'YOUR_GEMINI_API_KEY' &&
        apiKey!.length > 10;

      if (!hasValidKey) {
        res.json(localFallback);
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contextSummary = selectedArtifact
        ? `Currently viewed world: ${selectedDest.name}. Currently selected hardware: ${selectedArtifact.name} (${selectedArtifact.mission}, Status: ${selectedArtifact.status}).`
        : `Currently viewed Solar System region: ${selectedDest.name} (${selectedDest.subtitle}).`;

      const conversationSnippet = Array.isArray(history) && history.length > 0
        ? `\nRECENT CONVERSATION:\n${history
            .slice(-6)
            .map((m) => `${m.role === 'user' ? 'User' : 'Space Explorer AI'}: ${m.text}`)
            .join('\n')}`
        : '';

      const systemInstruction = `You are "Space Explorer AI", a friendly, knowledgeable space and astronomy educational assistant.

CORE CAPABILITIES & BOUNDARIES:
1. You answer questions about ANY space or astronomy topic: planets, moons, stars, galaxies, black holes, nebulae, comets, asteroids, rockets, spacecraft, telescopes (including Hubble and James Webb Space Telescope), astronauts, space missions, the Solar System, the Milky Way, exoplanets, cosmology, and the universe.
2. Keep responses accurate, clear, beginner-friendly, and informative. Never invent facts.
3. Keep replies concise by default (2 to 4 clear sentences), UNLESS the user asks for more detail / deeper explanation—in which case provide a clear, structured, detailed explanation.
4. If the user asks a non-space question (unrelated to space, astronomy, astrophysics, aerospace, or space missions), politely explain that you are specialized for space and astronomy questions and offer to answer a space-related question instead (e.g., respond politely like: "${STRICT_REFUSAL_MESSAGE}").

ACTIVE SITE CONTEXT:
${contextSummary}
${conversationSnippet}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: trimmedQuestion,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 9500)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.json(localFallback);
        return;
      }

      const lowerRaw = rawText.toLowerCase();
      const isRefusal =
        rawText.includes(STRICT_REFUSAL_MESSAGE) ||
        lowerRaw.includes('specialized for space and astronomy');

      if (isRefusal) {
        res.json({
          reply: rawText,
          sources: [],
          relatedArtifacts: [],
          isRefusal: true,
        });
        return;
      }

      res.json({
        reply: rawText,
        sources: localFallback.sources,
        relatedArtifacts: localFallback.relatedArtifacts,
        isRefusal: false,
      });
    } catch (_err) {
      const { question = '', destinationId, artifactId, history = [] } = req.body || {};
      const lastUserTopic = Array.isArray(history)
        ? [...history].reverse().find((m: { role: string }) => m.role === 'user')?.text
        : undefined;
      const fallback = buildLocalExplorerGuideAnswer(String(question), {
        destinationId,
        artifactId,
        lastTopicText: lastUserTopic,
      });
      res.json(fallback);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Silent Explorers server running at http://localhost:${PORT}`);
  });
}

startServer();
