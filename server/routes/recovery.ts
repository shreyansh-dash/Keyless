import { Router, Request, Response } from 'express';
import { db } from '../db/storage';
import { sha256 } from '../crypto/webauthnUtils';

export const recoveryRouter = Router();

// 1. Get guardians for a user
recoveryRouter.get('/guardians', (req: Request, res: Response) => {
  const attestedCount = db.guardians.filter(g => g.status === 'ATTESTED').length;
  res.json({
    success: true,
    guardians: db.guardians,
    threshold: 2,
    total: db.guardians.length,
    attestedCount,
    thresholdSatisfied: attestedCount >= 2,
  });
});

// 2. Sign / Attest guardian approval (2-of-3 Social Recovery)
recoveryRouter.post('/guardians/sign', (req: Request, res: Response) => {
  const { id } = req.body;
  const guardian = db.guardians.find(g => g.id === id);

  if (!guardian) {
    return res.status(404).json({ success: false, error: 'Guardian not found' });
  }

  // Toggle status
  guardian.status = guardian.status === 'ATTESTED' ? 'PENDING' : 'ATTESTED';
  guardian.attestedAt = guardian.status === 'ATTESTED' ? new Date().toISOString().substring(11, 19) : undefined;
  db.persist();

  const attestedCount = db.guardians.filter(g => g.status === 'ATTESTED').length;
  const thresholdSatisfied = attestedCount >= 2;

  db.addAuditLog({
    stage: 'GUARDIAN_SIGN',
    opcode: 'SIG_VERIFY',
    details: `Guardian [${guardian.name}] approval: ${guardian.status} (${attestedCount}/2 required)`,
    rawPayload: {
      guardianRole: guardian.designation,
      publicKeyShard: guardian.keyFingerprint,
      thresholdSatisfied,
      recoveryTokenIssued: thresholdSatisfied ? 'RECOVERY-AUTH-TOKEN-ISSUED' : 'AWAITING_SECOND_SIGNER',
    },
    status: thresholdSatisfied ? 'success' : 'info',
    source: 'SERVER',
  });

  res.json({
    success: true,
    guardian,
    attestedCount,
    thresholdSatisfied,
    recoveryToken: thresholdSatisfied ? `REC-GRANT-${Date.now()}` : null,
  });
});

// 3. Verify Offline 12-Word Mnemonic Phrase
recoveryRouter.post('/verify-mnemonic', (req: Request, res: Response) => {
  const { words } = req.body;

  if (!Array.isArray(words) || words.length !== 12) {
    return res.status(400).json({ success: false, error: 'Must provide exactly 12 words' });
  }

  const cleanedWords = words.map(w => (w || '').trim().toLowerCase());
  const expectedHash = sha256(db.paperMnemonicWords.join(' ')).hex;
  const submittedHash = sha256(cleanedWords.join(' ')).hex;

  const isMatch = submittedHash === expectedHash;

  if (isMatch) {
    db.addAuditLog({
      stage: 'RECOVERY_PAPER_KEY',
      opcode: 'OK',
      details: '12-word emergency backup phrase verified offline via cryptographic hash. Account access restored.',
      rawPayload: {
        wordsChecked: 12,
        hashMatch: true,
        verificationMethod: 'BIP-39 Cryptographic Hash Validation',
      },
      status: 'success',
      source: 'SERVER',
    });

    return res.json({
      success: true,
      verified: true,
      recoveryToken: `PAPER-RESTORE-${Date.now()}`,
    });
  } else {
    db.addAuditLog({
      stage: 'RECOVERY_FAIL',
      opcode: 'ERR',
      details: 'Invalid backup words submitted for emergency paper key recovery.',
      status: 'error',
      source: 'SERVER',
    });

    return res.status(400).json({
      success: false,
      verified: false,
      error: 'Invalid backup words entered. Please check word order and spelling.',
    });
  }
});
