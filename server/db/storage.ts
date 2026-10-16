import fs from 'node:fs';
import path from 'node:path';

export interface Citizen {
  nationalId: string;
  name: string;
  service: string;
  riskScore: string;
  ipAddress: string;
}

export interface StoredCredential {
  id: string;
  userId: string;
  credentialIdBase64: string;
  publicKeyHex: string;
  publicKeyBase64?: string;
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

export interface StoredGuardian {
  id: string;
  userId: string;
  name: string;
  designation: string;
  phoneLast4: string;
  avatarSeed: string;
  status: 'PENDING' | 'ATTESTED';
  keyFingerprint: string;
  attestedAt?: string;
}

export interface KioskSession {
  sessionId: string;
  status: 'READY' | 'SCANNED' | 'AUTHORIZED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  audioCode: string;
  audioLang: 'en-IN' | 'hi-IN';
  authorizedUser?: Citizen;
  qrPayload: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  stage: string;
  opcode: 'INIT' | 'ENTROPY' | 'CLIENT_DATA' | 'AUTH_DATA' | 'SIG_VERIFY' | 'OK' | 'ERR';
  details: string;
  rawPayload?: any;
  status: 'info' | 'success' | 'warning' | 'error';
  source: 'SERVER' | 'CLIENT';
}

export interface ChallengeRecord {
  challenge: string;
  userId?: string;
  userEmail?: string;
  type: 'REGISTRATION' | 'AUTHENTICATION';
  createdAt: number;
  expiresAt: number;
}

class Database {
  private dataDir: string;
  private filePath: string;
  private sseClients: Array<(log: AuditLog) => void> = [];
  private kioskListeners: Map<string, Array<(session: KioskSession) => void>> = new Map();

  users: Citizen[] = [];
  credentials: StoredCredential[] = [];
  guardians: StoredGuardian[] = [];
  kioskSessions: Map<string, KioskSession> = new Map();
  challenges: Map<string, ChallengeRecord> = new Map();
  auditLogs: AuditLog[] = [];

  // Simulated UIDAI Central Identities Data Repository (CIDR)
  // Maps official government Aadhaar numbers to verified citizen identities
  officialCidr: Map<string, { officialName: string; dob: string; state: string; maskedPhone: string }> = new Map([
    ['380563080624', { officialName: 'Dhruv Yadav', dob: '1998-04-12', state: 'Delhi', maskedPhone: 'XXXX-XX-0824' }],
    ['999911112222', { officialName: 'Amit Kumar', dob: '1995-10-21', state: 'Haryana', maskedPhone: 'XXXX-XX-2222' }],
    ['IN-AADHAAR-8921-9941', { officialName: 'Kunal Sharma', dob: '1994-07-15', state: 'Delhi', maskedPhone: 'XXXX-XX-9941' }],
    ['IN-AADHAAR-3104-5829', { officialName: 'Priya Patel', dob: '1997-12-03', state: 'Gujarat', maskedPhone: 'XXXX-XX-5829' }],
    ['551288014432', { officialName: 'Priya Patel', dob: '1997-12-03', state: 'Gujarat', maskedPhone: 'XXXX-XX-4432' }],
    ['774099211205', { officialName: 'Arjun Sundaram', dob: '1992-03-29', state: 'Tamil Nadu', maskedPhone: 'XXXX-XX-1205' }],
    ['450912886623', { officialName: 'Ramesh Kumar', dob: '1989-08-19', state: 'Uttar Pradesh', maskedPhone: 'XXXX-XX-6623' }],
    ['662133901142', { officialName: 'Ananya Sharma', dob: '2001-01-25', state: 'Maharashtra', maskedPhone: 'XXXX-XX-1142' }]
  ]);
  
  // 12-Word Mnemonic SHA-256 hash for offline recovery
  paperMnemonicWords: string[] = [
    'falcon', 'quantum', 'cipher', 'marble',
    'tactile', 'shield', 'monolith', 'cobalt',
    'parchment', 'anchor', 'zenith', 'vector'
  ];

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'server', 'data');
    this.filePath = path.join(this.dataDir, 'store.json');
    this.initDatabase();
  }

  private initDatabase() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.credentials = parsed.credentials || [];
        this.guardians = parsed.guardians || [];
        this.auditLogs = parsed.auditLogs || [];
      } else {
        this.seedDefaults();
        this.persist();
      }
    } catch (err) {
      console.warn('[DB] Failed to load store.json, seeding in-memory defaults:', err);
      this.seedDefaults();
    }

    // Always ensure default seed exists if list is empty
    if (this.users.length === 0) {
      this.seedDefaults();
      this.persist();
    }
  }

  private seedDefaults() {
    this.users = [
      {
        nationalId: 'IN-AADHAAR-8921-9941',
        name: 'Kunal Sharma',
        service: 'National Digital Identity Grid (DigiLocker)',
        riskScore: 'LOW (0.04)',
        ipAddress: '103.24.112.44 (New Delhi, IN)',
      },
      {
        nationalId: 'IN-AADHAAR-3104-5829',
        name: 'Priya Patel',
        service: 'Direct Benefit Transfer (DBT)',
        riskScore: 'LOW (0.01)',
        ipAddress: '115.112.24.8 (Ahmedabad, IN)',
      }
    ];

    this.credentials = [
      {
        id: 'cred-001',
        userId: 'IN-AADHAAR-8921-9941',
        credentialIdBase64: 'kX82vN9u1Lp_3Z8w_demo01',
        publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d030107034200049f57c210ab4e823f982144d18726e69622d9972301abf192b4756c9a89d4193b2169b1836541f4862b53b890a8277215c7198a2e5581971253',
        deviceModel: 'Apple Silicon Secure Enclave (Touch ID)',
        aaguid: '08987058-cadc-4b81-b6e1-30de50dcbe10',
        algorithm: 'ES256 (P-256 ECDSA)',
        counter: 412,
        createdAt: '2026-02-14 09:12:00',
        lastUsedAt: 'Just now',
        transports: ['internal'],
        userVerified: true,
        userPresent: true,
        revoked: false,
        trustLevel: 'ENCLAVE_TIER_1',
      },
      {
        id: 'cred-002',
        userId: 'IN-AADHAAR-8921-9941',
        credentialIdBase64: 'q8Zm48B7aV_76Cw_demo02',
        publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d03010703420004a2c140921dfbb392e921d749921b72e55819921448b192b4756c9a89d4193b2169b1836541f4862b53b890a8277215c7198a2e5581971253',
        deviceModel: 'Yubico YubiKey 5C NFC (FIDO2 Hardware Token)',
        aaguid: 'ee882879-721c-4916-ad4e-57c7f157f383',
        algorithm: 'ES256 (P-256 ECDSA)',
        counter: 1205,
        createdAt: '2026-01-10 16:45:22',
        lastUsedAt: 'Yesterday 14:20',
        transports: ['usb', 'nfc'],
        userVerified: true,
        userPresent: true,
        revoked: false,
        trustLevel: 'ROAMING_FIDO2',
      },
      {
        id: 'cred-003',
        userId: 'IN-AADHAAR-8921-9941',
        credentialIdBase64: '7xX9Lkp42M_10Nx_demo03',
        publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d030107034200045f8de581921dfbb392e921d749921b72e55819921448b192b4756c9a89d4193b2169b1836541f4862b53b890a8277215c7198a2e5581971253',
        deviceModel: 'Google Titan M2 Security Chip (Pixel 8)',
        aaguid: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
        algorithm: 'ES256 (P-256 ECDSA)',
        counter: 89,
        createdAt: '2025-11-20 11:03:19',
        lastUsedAt: '4 days ago',
        transports: ['internal', 'hybrid'],
        userVerified: true,
        userPresent: true,
        revoked: false,
        trustLevel: 'HARDWARE_BACKED',
      },
      {
        id: 'cred-004',
        userId: 'IN-AADHAAR-3104-5829',
        credentialIdBase64: 'p9Y2mN4v8Lq_4K9x_demo04',
        publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d030107034200047b8812c491dfbb392e921d749921b72e55819921448b192b4756c9a89d4193b2169b1836541f4862b53b890a8277215c7198a2e5581971253',
        deviceModel: 'Google Titan M2 Security Chip (Pixel 8)',
        aaguid: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4',
        algorithm: 'ES256 (P-256 ECDSA)',
        counter: 45,
        createdAt: '2026-01-22 14:10:00',
        lastUsedAt: '2 days ago',
        transports: ['internal'],
        userVerified: true,
        userPresent: true,
        revoked: false,
        trustLevel: 'HARDWARE_BACKED',
      }
    ];

    this.guardians = [
      {
        id: 'g-1',
        userId: 'IN-AADHAAR-8921-9941',
        name: 'Dr. Anita Rao',
        designation: 'NIC Regional Technical Director',
        phoneLast4: '8821',
        avatarSeed: 'AR',
        status: 'PENDING',
        keyFingerprint: 'ED25519:f928...41a',
      },
      {
        id: 'g-2',
        userId: 'IN-AADHAAR-8921-9941',
        name: 'Vikramaditya Verma',
        designation: 'CSC Village Level Entrepreneur (VLE)',
        phoneLast4: '3014',
        avatarSeed: 'VV',
        status: 'PENDING',
        keyFingerprint: 'ED25519:80c2...11d',
      },
      {
        id: 'g-3',
        userId: 'IN-AADHAAR-8921-9941',
        name: 'Meera Sharma',
        designation: 'Nominated Primary Kin / Co-Signer',
        phoneLast4: '7749',
        avatarSeed: 'MS',
        status: 'PENDING',
        keyFingerprint: 'ED25519:12be...99f',
      }
    ];

    this.auditLogs = [
      {
        id: 'log-srv-0',
        timestamp: new Date().toISOString().substring(11, 23),
        stage: 'SERVER_BOOT',
        opcode: 'INIT',
        details: 'RP Server initialized. Standards: RFC 8827, NIST SP 800-63B AAL3, DPDP Act 2023.',
        status: 'info',
        source: 'SERVER',
      }
    ];

    // Seed default Kiosk session
    const defaultKiosk: KioskSession = {
      sessionId: 'CSC-VLE-UP-7029',
      status: 'READY',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      audioCode: '842',
      audioLang: 'en-IN',
      qrPayload: 'https://id.digilocker.gov.in/kiosk-pair?sessionId=CSC-VLE-UP-7029',
    };
    this.kioskSessions.set(defaultKiosk.sessionId, defaultKiosk);
  }

  persist() {
    try {
      const dataToSave = {
        users: this.users,
        credentials: this.credentials,
        guardians: this.guardians,
        auditLogs: this.auditLogs.slice(0, 100),
      };
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Persist error:', err);
    }
  }

  // --- Audit Log Subsystem ---
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const fullLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().substring(11, 23),
    };
    this.auditLogs = [fullLog, ...this.auditLogs.slice(0, 99)];

    // Broadcast to SSE clients
    for (const client of this.sseClients) {
      try {
        client(fullLog);
      } catch (err) {
        // drop disconnected client
      }
    }

    return fullLog;
  }

  registerSSEClient(callback: (log: AuditLog) => void) {
    this.sseClients.push(callback);
    return () => {
      this.sseClients = this.sseClients.filter(c => c !== callback);
    };
  }

  // --- Kiosk Realtime Subsystem ---
  updateKioskSession(sessionId: string, patch: Partial<KioskSession>): KioskSession | null {
    const session = this.kioskSessions.get(sessionId);
    if (!session) return null;
    const updated = { ...session, ...patch };
    this.kioskSessions.set(sessionId, updated);

    // Notify listeners
    const listeners = this.kioskListeners.get(sessionId) || [];
    for (const listener of listeners) {
      try {
        listener(updated);
      } catch (err) {
        // pass
      }
    }
    return updated;
  }

  registerKioskListener(sessionId: string, callback: (session: KioskSession) => void) {
    const list = this.kioskListeners.get(sessionId) || [];
    list.push(callback);
    this.kioskListeners.set(sessionId, list);
    return () => {
      const current = this.kioskListeners.get(sessionId) || [];
      this.kioskListeners.set(sessionId, current.filter(l => l !== callback));
    };
  }
}

export const db = new Database();
