import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { db } from './db/storage';
import { authRouter } from './routes/auth';
import { devicesRouter } from './routes/devices';
import { recoveryRouter } from './routes/recovery';
import { kioskRouter } from './routes/kiosk';
import { telemetryRouter } from './routes/telemetry';

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or local tools)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// Request logger for dev terminal
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.includes('/stream')) {
      console.log(`[RP-SERVER] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health & System Info
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'FIDO2 / WebAuthn Relying Party Backend',
    rpName: CONFIG.RP_NAME,
    rpId: CONFIG.RP_ID,
    compliance: 'NIST SP 800-63B AAL3 / India DPDP Act 2023',
    uptimeSeconds: Math.round(process.uptime()),
    registeredCitizens: db.users.length,
    activeCredentials: db.credentials.filter(c => !c.revoked).length,
    timestamp: new Date().toISOString(),
  });
});

// Route Modules
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/kiosk', kioskRouter);
app.use('/api/telemetry', telemetryRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[RP-SERVER] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Relying Party Server Error',
    message: err.message || 'Unknown error occurred',
  });
});

// Start listening
const server = app.listen(CONFIG.PORT, () => {
  console.log(`
===================================================================
  SECURE PASSKEY LOGIN // RELYING PARTY (RP) BACKEND ONLINE
  Problem Statement: CC6-IC04 | National Digital Identity (India)
===================================================================
  Server URL:       http://localhost:${CONFIG.PORT}
  API Health:       http://localhost:${CONFIG.PORT}/api/health
  RP Name:          ${CONFIG.RP_NAME}
  RP ID:            ${CONFIG.RP_ID}
  Standards:        FIDO2 Level 3 / NIST SP 800-63B AAL3 / DPDP 2023
===================================================================
`);
});

export default app;
