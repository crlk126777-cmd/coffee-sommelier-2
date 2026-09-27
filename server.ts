import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getActiveKnowledgeBase,
  getActiveConfig,
  syncGoogleSheet,
  resetToDefaultBase,
  generateKnowledgeBaseCsv,
} from './server/sheetsService.ts';
import { askCoffeeSommelier, ChatMessage } from './server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Attempt initial sync if GOOGLE_SHEET_URL is provided in environment
  if (process.env.GOOGLE_SHEET_URL) {
    try {
      console.log('Attempting initial Google Sheet sync from GOOGLE_SHEET_URL...');
      await syncGoogleSheet(process.env.GOOGLE_SHEET_URL);
      console.log('Initial Google Sheet sync successful.');
    } catch (err: any) {
      console.warn('Initial Google Sheet sync warning:', err.message);
    }
  }

  // --- API Routes ---

  // 1. Get current Knowledge Base and Connection Status
  app.get('/api/knowledge-base', (_req: Request, res: Response) => {
    try {
      const entries = getActiveKnowledgeBase();
      const config = getActiveConfig();
      res.json({ success: true, entries, config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 2. Sync / Connect Google Sheets
  app.post('/api/knowledge-base/sync', async (req: Request, res: Response) => {
    try {
      const { sheetUrl } = req.body;
      if (!sheetUrl) {
        return res.status(400).json({
          success: false,
          error: 'Укажите ссылку на Google Таблицу.',
        });
      }

      const { entries, config } = await syncGoogleSheet(sheetUrl);
      res.json({ success: true, entries, config });
    } catch (error: any) {
      console.error('Sheet sync error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Не удалось синхронизировать Google Таблицу.',
        config: getActiveConfig(),
      });
    }
  });

  // 3. Reset to default curated base
  app.post('/api/knowledge-base/reset', (_req: Request, res: Response) => {
    try {
      const { entries, config } = resetToDefaultBase();
      res.json({ success: true, entries, config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 4. Download template CSV for Google Sheets
  app.get('/api/knowledge-base/template-csv', (_req: Request, res: Response) => {
    try {
      const csv = generateKnowledgeBaseCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="coffee_knowledge_base_template.csv"');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 5. Chat endpoint for Coffee Sommelier
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, categoryFilter, history } = req.body;

    // Check empty message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.json({
        reply: 'Введите вопрос о кофе.',
      });
    }

    try {
      const knowledgeBase = getActiveKnowledgeBase();
      const reply = await askCoffeeSommelier({
        message,
        categoryFilter,
        history: Array.isArray(history) ? (history as ChatMessage[]) : [],
        knowledgeBase,
      });

      res.json({ reply });
    } catch (error: any) {
      console.error('Chat error:', error);
      // Technical error format requested in rule 8
      res.status(500).json({
        error: 'Не удалось получить ответ. Попробуйте ещё раз.',
        details: error?.message,
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Serve frontend ---
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ Coffee Sommelier server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
