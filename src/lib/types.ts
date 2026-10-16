export type AuthStage = 
  | 'IDLE' 
  | 'CHALLENGE_ISSUED' 
  | 'PROMPTING_AUTHENTICATOR' 
  | 'COLLECTING_CLIENT_DATA' 
  | 'VERIFYING_FLAGS' 
  | 'VERIFYING_SIGNATURE' 
  | 'AUTHENTICATED' 
  | 'FAILED_MISMATCH';

export interface TelemetryLog {
  id: string;
  timestamp: string;
  stage: string;
  opcode: 'INIT' | 'ENTROPY' | 'CLIENT_DATA' | 'AUTH_DATA' | 'SIG_VERIFY' | 'OK' | 'ERR';
  details: string;
  rawPayload?: Record<string, any> | string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface CredentialDevice {
  id: string;
  userId?: string;
  credentialIdBase64: string;
  publicKeyHex: string;
  deviceModel: string;
  aaguid: string;
  algorithm: 'ES256 (P-256 ECDSA)' | 'EdDSA (Ed25519)' | 'RS256';
  counter: number;
  createdAt: string;
  lastUsedAt: string;
  transports: Array<'internal' | 'usb' | 'nfc' | 'ble' | 'hybrid'>;
  userVerified: boolean;
  userPresent: boolean;
  revoked: boolean;
  trustLevel: 'HARDWARE_BACKED' | 'ENCLAVE_TIER_1' | 'ROAMING_FIDO2';
}

export interface Guardian {
  id: string;
  name: string;
  designation: string;
  phoneLast4: string;
  avatarSeed: string;
  status: 'PENDING' | 'ATTESTED';
  keyFingerprint: string;
  attestedAt?: string;
}

export type ViewTab = 
  | 'AUTH' 
  | 'PHISHING' 
  | 'RECOVERY' 
  | 'INCLUSIVITY' 
  | 'ADMIN' 
  | 'THREAT_MODEL';
