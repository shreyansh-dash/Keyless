import { Router, Request, Response } from 'express';
import { db, KioskSession } from '../db/storage';

export const kioskRouter = Router();

// 1. Create or get existing kiosk session
kioskRouter.post('/session', (req: Request, res: Response) => {
  const { sessionId = 'CSC-VLE-UP-7029', audioLang = 'en-IN' } = req.body;
  let session = db.kioskSessions.get(sessionId);

  if (!session) {
    const randomCode = Math.floor(100 + Math.random() * 900).toString();
    session = {
      sessionId,
      status: 'READY',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      audioCode: randomCode,
      audioLang: audioLang as 'en-IN' | 'hi-IN',
      qrPayload: `https://id.digilocker.gov.in/kiosk-pair?sessionId=${sessionId}`,
    };
    db.kioskSessions.set(sessionId, session);
  }

  res.json({
    success: true,
    session,
  });
});

// 2. Get current status of kiosk session
kioskRouter.get('/session/:id', (req: Request, res: Response) => {
  const session = db.kioskSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Kiosk session not found' });
  }
  res.json({
    success: true,
    session,
  });
});

// 3. Citizen scans QR code with mobile phone
kioskRouter.post('/session/:id/scan', (req: Request, res: Response) => {
  const session = db.kioskSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Kiosk session not found' });
  }

  const updated = db.updateKioskSession(req.params.id, {
    status: 'SCANNED',
  });

  db.addAuditLog({
    stage: 'HYBRID_QR_SCANNED',
    opcode: 'CLIENT_DATA',
    details: `Public village kiosk paired with trusted mobile device via FIDO Hybrid QR link`,
    rawPayload: {
      kioskId: session.sessionId,
      channel: 'Hybrid Transport (CTAP2 QR + BLE Proximity)',
      publicKioskDevice: 'Common Service Centre Terminal #04',
      status: 'AWAITING_BIOMETRIC_ON_PHONE',
    },
    status: 'info',
    source: 'SERVER',
  });

  res.json({
    success: true,
    session: updated,
  });
});

// 4. Citizen authorizes on phone (zero keystrokes on kiosk PC)
kioskRouter.post('/session/:id/authorize', (req: Request, res: Response) => {
  const session = db.kioskSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Kiosk session not found' });
  }

  const user = db.users[0]; // Authorized citizen
  const updated = db.updateKioskSession(req.params.id, {
    status: 'AUTHORIZED',
    authorizedUser: user,
  });

  db.addAuditLog({
    stage: 'KIOSK_AUTH_CONFIRMED',
    opcode: 'OK',
    details: `Citizen ${user.name} approved biometric login on mobile. Public kiosk screen unlocked.`,
    rawPayload: {
      kioskSessionId: session.sessionId,
      passwordsTypedOnPublicPC: 'Zero (No keyboard / PIN entered)',
      safetyVerdict: '100% Keylogger-Proof & Shoulder-Surfing Proof',
      assuranceLevel: 'NIST SP 800-63B AAL3',
    },
    status: 'success',
    source: 'SERVER',
  });

  res.json({
    success: true,
    session: updated,
  });
});

// 5. Reset kiosk demo session
kioskRouter.post('/session/:id/reset', (req: Request, res: Response) => {
  const session = db.kioskSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Kiosk session not found' });
  }

  const updated = db.updateKioskSession(req.params.id, {
    status: 'READY',
    authorizedUser: undefined,
  });

  res.json({
    success: true,
    session: updated,
  });
});

// 6. SSE Real-Time Stream for Kiosk Terminal
kioskRouter.get('/session/:id/stream', (req: Request, res: Response) => {
  const session = db.kioskSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state
  res.write(`data: ${JSON.stringify(session)}\n\n`);

  const unregister = db.registerKioskListener(req.params.id, (updatedSession) => {
    res.write(`data: ${JSON.stringify(updatedSession)}\n\n`);
  });

  req.on('close', () => {
    unregister();
  });
});
