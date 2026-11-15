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

  // Health & API endpoint for Explorer Guide Chatbot
  app.post('/api/explorer-guide', async (req, res) => {
    try {
      const {
        question = '',
        destinationId,
        artifactId,
      }: {
        question?: string;
        destinationId?: DestinationId;
        artifactId?: string;
      } = req.body || {};

      const trimmedQuestion = String(question).trim();
      if (!trimmedQuestion) {
        res.status(400).json({ error: 'Question is required.' });
        return;
      }

      // 1. Strict topic pre-check: immediately refuse off-topic requests with the exact required text
      if (!isSpaceTopicQuery(trimmedQuestion)) {
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
        ? `Currently selected destination: ${selectedDest.name}. Currently selected artifact: ${selectedArtifact.name} (${selectedArtifact.mission}, Status: ${selectedArtifact.status}, Location: ${selectedArtifact.locationOrTrajectory}, NASA Source: ${selectedArtifact.nasaSourceUrl}).`
        : `Currently selected destination: ${selectedDest.name} (${selectedDest.subtitle}, NASA Source: ${selectedDest.nasaUrl}).`;

      const catalogSummary = ARTIFACTS.map(
        (a) =>
          `- ${a.name} [id: ${a.id}] (${a.mission}, ${a.destinationId}, Status: ${a.status}): ${a.purpose} Source: ${a.nasaSourceUrl}`
      ).join('\n');

      const systemInstruction = `You are "Explorer Guide", an educational assistant inside the "Silent Explorers: NASA’s Left-Behind Machines" web application for the NASA Space Apps Challenge.
Your primary audience is students aged 10–16 and casual space learners.

STRICT RULES:
1. You must ONLY explain the NASA hardware, missions, planets, moons, timelines, and space-science content featured in this experience.
2. You must NEVER perform general web searches, generate code, write essays/homework/emails/resumes/stories/creative fiction, provide medical/legal/financial/political/personal advice, discuss unrelated topics, control navigation, or pretend to be human.
3. If the user asks about ANY unrelated subject or asks you to write essays, code, fiction, or non-space content, you MUST respond with this EXACT sentence and nothing else:
"${STRICT_REFUSAL_MESSAGE}"
4. Keep valid space-science answers concise (2 to 4 short sentences), friendly, accurate, and easy for ages 10–16 to understand. Define any technical term in plain English.
5. Clearly distinguish whether hardware is Active, Dormant, Retired, Still Traveling, or at an Impact Site.

ACTIVE VIEW CONTEXT:
${contextSummary}

FEATURED HARDWARE CATALOG:
${catalogSummary}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: trimmedQuestion,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.json(localFallback);
        return;
      }

      if (rawText.includes(STRICT_REFUSAL_MESSAGE)) {
        res.json({
          reply: STRICT_REFUSAL_MESSAGE,
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
      // Graceful fallback if API key is unconfigured or network/quota error occurs
      const { question = '', destinationId, artifactId } = req.body || {};
      const fallback = buildLocalExplorerGuideAnswer(String(question), {
        destinationId,
        artifactId,
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
