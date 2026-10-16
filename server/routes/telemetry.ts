import { Router, Request, Response } from 'express';
import { db, AuditLog } from '../db/storage';

export const telemetryRouter = Router();

// 1. Get recent audit logs
telemetryRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    logs: db.auditLogs,
    count: db.auditLogs.length,
  });
});

// 2. Post client-side audit event to server ledger
telemetryRouter.post('/log', (req: Request, res: Response) => {
  const { stage, opcode, details, rawPayload, status } = req.body;

  const newLog = db.addAuditLog({
    stage: stage || 'CLIENT_EVENT',
    opcode: opcode || 'INIT',
    details: details || '',
    rawPayload,
    status: status || 'info',
    source: 'CLIENT',
  });

  res.json({
    success: true,
    log: newLog,
  });
});

// 3. Clear audit logs
telemetryRouter.post('/clear', (req: Request, res: Response) => {
  db.auditLogs = [];
  const resetLog = db.addAuditLog({
    stage: 'TERMINAL',
    opcode: 'INIT',
    details: 'Security audit trail log buffer cleared. Relying Party standby for next cryptographic event.',
    status: 'info',
    source: 'SERVER',
  });

  res.json({
    success: true,
    logs: [resetLog],
  });
});

// 4. Server-Sent Events (SSE) Stream for real-time live telemetry
telemetryRouter.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial recent logs
  res.write(`event: init\ndata: ${JSON.stringify(db.auditLogs.slice(0, 20))}\n\n`);

  const unregister = db.registerSSEClient((newLog: AuditLog) => {
    res.write(`event: log\ndata: ${JSON.stringify(newLog)}\n\n`);
  });

  // Keep-alive heartbeat every 15s
  const interval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    unregister();
  });
});
