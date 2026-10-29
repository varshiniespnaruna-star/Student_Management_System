import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/auth.js';
import { studentsRouter } from './server/routes/students.js';
import { teachersRouter } from './server/routes/teachers.js';
import { adminRouter } from './server/routes/admin.js';
import { uploadsRouter } from './server/routes/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/students', studentsRouter);
  app.use('/api/v1/teachers', teachersRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/uploads', uploadsRouter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      system: 'Smart Student Management System (SSMS)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Frontend integration: Vite middleware in dev, static files in prod
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'An unexpected internal server error occurred.',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SSMS Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
