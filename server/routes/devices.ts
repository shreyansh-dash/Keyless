import { Router, Request, Response } from 'express';
import { db, StoredCredential } from '../db/storage';
import { generateChallengeNonce, bufferToBase64URL } from '../crypto/webauthnUtils';

export const devicesRouter = Router();

// 1. List devices (optionally filtered by user)
devicesRouter.get('/', (req: Request, res: Response) => {
  const { userId } = req.query;
  const filtered = userId 
    ? db.credentials.filter(c => c.userId === userId)
    : db.credentials;
  res.json({
    success: true,
    devices: filtered,
  });
});

// 2. Enroll a secondary hardware token / passkey
devicesRouter.post('/enroll', (req: Request, res: Response) => {
  try {
    const { userId, deviceModel, transport } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId (Aadhaar / National ID) is required' });
    }
    const targetUserId = userId;
    const model = deviceModel || 'YubiKey Security Key NFC';
    const chosenTransport = transport || 'usb';

    const newDevice: StoredCredential = {
      id: `cred-${Date.now().toString(36)}`,
      userId: targetUserId,
      credentialIdBase64: bufferToBase64URL(generateChallengeNonce(16).raw),
      publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d03010703420004' + generateChallengeNonce(32).hex,
      deviceModel: model,
      aaguid: `${generateChallengeNonce(4).hex}-${generateChallengeNonce(2).hex}-4a81-b6e1-${generateChallengeNonce(6).hex}`,
      algorithm: 'ES256 (P-256 ECDSA)',
      counter: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastUsedAt: 'Never (Newly Enrolled)',
      transports: [chosenTransport],
      userVerified: true,
      userPresent: true,
      revoked: false,
      trustLevel: chosenTransport === 'internal' ? 'ENCLAVE_TIER_1' : 'ROAMING_FIDO2',
    };

    db.credentials = [newDevice, ...db.credentials];
    db.persist();

    db.addAuditLog({
      stage: 'KEY_REGISTRATION',
      opcode: 'OK',
      details: `New hardware device added to citizen profile: [${model}]`,
      rawPayload: {
        credentialId: newDevice.credentialIdBase64,
        aaguid: newDevice.aaguid,
        transport: chosenTransport,
        status: 'ACTIVE_AND_ATTESTED',
      },
      status: 'success',
      source: 'SERVER',
    });

    res.json({
      success: true,
      device: newDevice,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Toggle Revocation (Blacklist in CRL)
devicesRouter.post('/:id/revoke', (req: Request, res: Response) => {
  const { id } = req.params;
  const device = db.credentials.find(c => c.id === id || c.credentialIdBase64 === id);

  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  device.revoked = !device.revoked;
  db.persist();

  db.addAuditLog({
    stage: 'KEY_REVOCATION',
    opcode: 'AUTH_DATA',
    details: `Hardware credential [${device.deviceModel}] status changed to: ${device.revoked ? 'REVOKED (Blacklisted in RP CRL)' : 'ACTIVE'}`,
    rawPayload: {
      aaguid: device.aaguid,
      credentialId: device.credentialIdBase64,
      revocationBroadcast: 'IMMEDIATE_CRL_UPDATE',
      policy: 'ZERO_TRUST_ENFORCEMENT',
    },
    status: device.revoked ? 'warning' : 'success',
    source: 'SERVER',
  });

  res.json({
    success: true,
    device,
  });
});

// 4. Delete device unbinding
devicesRouter.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = db.credentials.length;
  db.credentials = db.credentials.filter(c => c.id !== id && c.credentialIdBase64 !== id);

  if (db.credentials.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  db.persist();
  db.addAuditLog({
    stage: 'DEVICE_DELETED',
    opcode: 'AUTH_DATA',
    details: `Credential removed permanently from user keystore: ${id}`,
    status: 'info',
    source: 'SERVER',
  });

  res.json({ success: true, message: 'Device unlinked' });
});
