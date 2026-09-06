import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import https from 'node:https';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthenticatedRequest } from './server/auth';
import {
  chatWithGeminiServer,
  generateReflectionServer,
  synthesizeInsightsServer,
} from './server/geminiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Transparent reverse proxy for Firebase Authentication handler & helper assets
  // Resolves auth/invalid-continue-uri by serving /__/auth/* on the runtime preview domain
  app.use(['/__/auth', '/__/firebase'], (req: Request, res: Response) => {
    const targetHost = 'personal-gemini-journal-82599.firebaseapp.com';
    const proxyPath = req.originalUrl || `/__/auth${req.url}`;
    const headers = { ...req.headers, host: targetHost };
    delete headers['accept-encoding'];

    const proxyReq = https.request(
      {
        hostname: targetHost,
        port: 443,
        path: proxyPath,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('Firebase Auth reverse proxy error:', err);
      if (!res.headersSent) {
        res.status(502).send('Firebase Auth proxy unavailable');
      }
    });

    req.pipe(proxyReq);
  });

  // Security hardening: hide server fingerprint and set basic defense headers
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Strict JSON payload body limit to prevent denial of service / wallet attacks
  app.use(express.json({ limit: '256kb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'Personal Gemini Journal' });
  });

  // Multi-turn conversational journaling companion endpoint
  app.post(
    '/api/chat',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { messages, journalContext } = req.body;

        if (!messages || !Array.isArray(messages)) {
          res.status(400).json({ error: 'Invalid input: messages array is required.' });
          return;
        }

        // Validate payload limits
        if (messages.length > 50) {
          res.status(400).json({ error: 'Conversation history exceeds maximum allowed limit.' });
          return;
        }

        const reply = await chatWithGeminiServer(messages, journalContext);
        res.json({ reply });
      } catch (err: any) {
        next(err);
      }
    }
  );

  // Generate structured session reflection & insights
  app.post(
    '/api/generate-reflection',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { title, content, messages } = req.body;

        if (typeof title !== 'string' && title !== undefined) {
          res.status(400).json({ error: 'Invalid title format.' });
          return;
        }

        const reflection = await generateReflectionServer(
          title || 'Untitled Session',
          content || '',
          Array.isArray(messages) ? messages : []
        );

        res.json(reflection);
      } catch (err: any) {
        next(err);
      }
    }
  );

  // Generate aggregate insights across the user's historical entries
  app.post(
    '/api/synthesize-insights',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { entries } = req.body;

        if (!entries || !Array.isArray(entries)) {
          res.status(400).json({ error: 'Invalid input: entries array is required.' });
          return;
        }

        const insights = await synthesizeInsightsServer(entries);
        res.json(insights);
      } catch (err: any) {
        next(err);
      }
    }
  );

  // Global sanitized error handler: never leak internal stack traces, tokens, or system variables
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Avoid logging sensitive client journal payloads or secrets
    console.error('Server operation error occurred');
    res.status(500).json({
      error: 'An internal server error occurred. Your journal data remains safe and isolated.',
    });
  });

  // --- Vite Dev Middleware / Production Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
