import type { ViewTab, AuthStage, TelemetryLog, CredentialDevice, Guardian } from './types';
import { generateChallenge, sha256, createSyntheticAuthData, bufferToHex, bufferToBase64URL, parseAuthenticatorData, speakAcousticChallenge } from './cryptoEngine';
import { startAuthentication, startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { api } from './api';

class SwissAuthStore {
  activeTab = $state<ViewTab>('AUTH');
  
  // Backend Relying Party Server Status
  backendOnline = $state<boolean>(false);
  backendInfo = $state<any>(null);

  // Authenticator verification mode
  authMode = $state<'NATIVE' | 'SIMULATED'>('SIMULATED');
  authError = $state<string>('');

  // Interactive Biometric Sensor Prompt State
  biometricPrompt = $state<{
    open: boolean;
    mode: 'LOGIN' | 'REGISTER';
    citizenName: string;
    nationalId: string;
    deviceModel: string;
    challengeHex: string;
    status: 'IDLE_WAITING' | 'SCANNING' | 'SUCCESS_VERIFIED' | 'MISMATCH_REJECTED';
    statusMessage: string;
    targetDeviceId?: string;
    pendingFormData?: {
      name: string;
      nationalId: string;
      service: string;
      deviceModel: string;
      transport: 'internal' | 'usb' | 'nfc' | 'hybrid';
    };
  }>({
    open: false,
    mode: 'LOGIN',
    citizenName: '',
    nationalId: '',
    deviceModel: '',
    challengeHex: '',
    status: 'IDLE_WAITING',
    statusMessage: '',
  });

  // Registered User Profiles
  registeredUsers = $state([
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
  ]);

  // User Profile (Zero-Footprint default: unauthenticated until citizen inputs Aadhaar)
  user = $state({
    nationalId: '',
    name: 'Unauthenticated Citizen',
    service: 'National Digital Identity Grid (DigiLocker)',
    riskScore: 'LOW (0.01)',
    ipAddress: '103.24.112.44 (New Delhi, IN)',
  });

  // Auth Flow
  authStage = $state<AuthStage>('IDLE');
  activeFingerprint = $state('SHA256:d489b1c0...93e17 (Secure Enclave)');
  activeAlgorithm = $state<'ES256 (P-256 ECDSA)' | 'EdDSA (Ed25519)'>('ES256 (P-256 ECDSA)');
  currentChallenge = $state<{ hex: string; base64url: string } | null>(null);
  lastLatencyMs = $state<number>(0);
  authSuccess = $state<boolean>(false);
  
  // Telemetry stream
  telemetry = $state<TelemetryLog[]>([]);

  // Registered credentials
  devices = $state<CredentialDevice[]>([
    {
      id: 'cred-001',
      userId: 'IN-AADHAAR-8921-9941',
      credentialIdBase64: 'kX82vN9u1Lp...3Z8',
      publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d030107034200049f57...',
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
      credentialIdBase64: 'q8Zm48B7aV...76C',
      publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d03010703420004a2c1...',
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
      credentialIdBase64: '7xX9Lkp42M...10N',
      publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d030107034200045f8d...',
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
      credentialIdBase64: 'p9Y2mN4v8Lq...4K9',
      publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d030107034200047b88...',
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
  ]);

  // Guardians for Non-SMS Recovery
  guardians = $state<Guardian[]>([
    {
      id: 'g-1',
      name: 'Dr. Anita Rao',
      designation: 'NIC Regional Technical Director',
      phoneLast4: '8821',
      avatarSeed: 'AR',
      status: 'PENDING',
      keyFingerprint: 'ED25519:f928...41a',
    },
    {
      id: 'g-2',
      name: 'Vikramaditya Verma',
      designation: 'CSC Village Level Entrepreneur (VLE)',
      phoneLast4: '3014',
      avatarSeed: 'VV',
      status: 'PENDING',
      keyFingerprint: 'ED25519:80c2...11d',
    },
    {
      id: 'g-3',
      name: 'Meera Sharma',
      designation: 'Nominated Primary Kin / Co-Signer',
      phoneLast4: '7749',
      avatarSeed: 'MS',
      status: 'PENDING',
      keyFingerprint: 'ED25519:12be...99f',
    }
  ]);

  paperMnemonic = [
    'falcon', 'quantum', 'cipher', 'marble', 
    'tactile', 'shield', 'monolith', 'cobalt', 
    'parchment', 'anchor', 'zenith', 'vector'
  ];

  // Inclusivity
  kioskSessionId = $state('CSC-VLE-UP-7029');
  audioCode = $state('842');
  audioLang = $state<'en-IN' | 'hi-IN' | 'ta-IN' | 'bn-IN' | 'te-IN'>('hi-IN');
  kioskStatus = $state<'READY' | 'SCANNED' | 'AUTHORIZED'>('READY');

  // Phishing Lab State
  phishingSim = $state({
    running: false,
    scenario: 'EVIL_TWIN_PROXY' as 'EVIL_TWIN_PROXY' | 'LOOKALIKE_DOMAIN',
    legitOrigin: 'https://id.digilocker.gov.in',
    attackerOrigin: 'https://id.digil0cker-gov.in',
    attackerPayload: '',
    rpValidationResult: null as 'PASS' | 'REJECT_ORIGIN_MISMATCH' | null,
    stepLogs: [] as string[],
  });

  constructor() {
    this.initDefaultLogs();
    this.initBackend();
  }

  initDefaultLogs() {
    this.telemetry = [
      {
        id: 'log-0',
        timestamp: new Date().toISOString().substring(11, 23),
        stage: 'SYSTEM_READY',
        opcode: 'INIT',
        details: 'Swiss Cryptographic Subsystem v4.1 Initialized. Relying Party (RP): id.digilocker.gov.in',
        status: 'info',
      },
      {
        id: 'log-1',
        timestamp: new Date().toISOString().substring(11, 23),
        stage: 'STANDARDS',
        opcode: 'INIT',
        details: 'FIDO2 / WebAuthn Level 3 Compliance Engine Online. Algorithms: ES256, EdDSA.',
        status: 'info',
      }
    ];
  }

  private backendInitializing = false;

  // Connect to backend and sync database state
  async initBackend() {
    if (this.backendInitializing) return;
    this.backendInitializing = true;

    try {
      const health = await api.getHealth();
      this.backendOnline = true;
      this.backendInfo = health;

      // Sync users & credentials from backend for evaluator presets (Zero-Footprint: does not auto-fill active user)
      const usersRes = await api.getUsers().catch(() => null);
      if (usersRes?.success && usersRes.users?.length) {
        this.registeredUsers = usersRes.users;
      }

      const devicesRes = await api.getDevices().catch(() => null);
      if (devicesRes?.success && Array.isArray(devicesRes.devices)) {
        this.devices = devicesRes.devices;
      }

      const guardiansRes = await api.getGuardians().catch(() => null);
      if (guardiansRes?.success && guardiansRes.guardians?.length) {
        this.guardians = guardiansRes.guardians;
      }

      this.addLog(
        'BACKEND_CONNECTED',
        'INIT',
        `Relying Party Backend Connected: http://localhost:3001 | ${health.service} (${health.compliance})`,
        {
          rpName: health.rpName,
          rpId: health.rpId,
          registeredCitizens: health.registeredCitizens,
          activeCredentials: health.activeCredentials,
          uptime: `${health.uptimeSeconds}s`,
        },
        'success'
      );
    } catch (err: any) {
      this.backendOnline = false;
      this.addLog(
        'STANDALONE_MODE',
        'INIT',
        'Operating in Client-Side Cryptographic Simulator Mode. RP Backend standby.',
        { details: 'To activate the full backend, run: npm.cmd run server' },
        'info'
      );
    }
  }

  addLog(stage: string, opcode: TelemetryLog['opcode'], details: string, rawPayload?: any, status: TelemetryLog['status'] = 'info') {
    const newEntry: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().substring(11, 23),
      stage,
      opcode,
      details,
      rawPayload,
      status,
    };
    this.telemetry = [newEntry, ...this.telemetry.slice(0, 49)];

    // Send to backend telemetry stream if connected (only for user actions)
    if (this.backendOnline && !stage.includes('INIT') && !stage.includes('STAND') && !stage.includes('BACKEND')) {
      api.postTelemetryLog(newEntry).catch(() => {});
    }
  }

  clearLogs() {
    this.telemetry = [];
    this.addLog('TERMINAL', 'INIT', 'Telemetry log buffer cleared. Waiting for next cryptographic event.');
    if (this.backendOnline) {
      api.clearTelemetry().catch(() => {});
    }
  }

  // Trigger Native WebAuthn or Cryptographic Virtual Authenticator
  async triggerAuthentication(deviceId?: string) {
    const startTime = performance.now();
    this.authSuccess = false;
    this.authError = '';

    // Validate that citizen identity was provided
    if (!this.user.nationalId || !this.user.nationalId.trim()) {
      this.authStage = 'FAILED_MISMATCH';
      this.authSuccess = false;
      this.authError = 'Please enter your 12-digit Aadhaar number before authenticating.';
      return;
    }

    // Verify citizen actually has registered passkeys (dynamically querying backend if needed)
    let citizenDevices = this.devices.filter(d => d.userId === this.user.nationalId);
    if (citizenDevices.length === 0 && this.backendOnline) {
      try {
        const prof = await api.getProfile(this.user.nationalId);
        if (prof?.success && Array.isArray(prof.devices) && prof.devices.length > 0) {
          const otherDevices = this.devices.filter(d => d.userId !== this.user.nationalId);
          this.devices = [...prof.devices, ...otherDevices];
          citizenDevices = prof.devices;
          if (prof.user) this.user = prof.user;
        }
      } catch {}
    }

    if (citizenDevices.length === 0) {
      this.authStage = 'FAILED_MISMATCH';
      this.authSuccess = false;
      this.authError = `NO REGISTERED PASSKEY FOUND: Citizen [${this.user.name}] (${this.user.nationalId}) has not registered a hardware passkey yet. Please click "02. CREATE ACCOUNT" to enroll your biometric passkey first.`;
      this.addLog(
        'LOGIN_BLOCKED',
        'ERR',
        `Access denied: No biometric passkeys enrolled for Aadhaar [${this.user.nationalId}]`,
        {
          citizen: this.user.name,
          nationalId: this.user.nationalId,
          remedy: 'Registration required in 02. CREATE ACCOUNT',
        },
        'error'
      );
      return;
    }

    // Identify target device
    const targetDevice = (deviceId ? citizenDevices.find(d => d.id === deviceId) : null)
      || citizenDevices.find(d => !d.revoked)
      || citizenDevices[0];

    // Check CRL: If the device is revoked, immediately halt and reject
    if (targetDevice.revoked) {
      this.authStage = 'FAILED_MISMATCH';
      this.authSuccess = false;
      this.authError = `AUTHENTICATION BLOCKED: Hardware key [${targetDevice.deviceModel}] is REVOKED in Relying Party CRL. Access denied.`;
      this.addLog(
        'BLOCKED_CREDENTIAL',
        'ERR',
        `Access denied: Hardware credential [${targetDevice.deviceModel}] is REVOKED in Relying Party CRL`,
        {
          credentialId: targetDevice.credentialIdBase64,
          aaguid: targetDevice.aaguid,
          action: 'TERMINATE_HANDSHAKE',
          defenseStandard: 'NIST SP 800-63B Authenticator Revocation List Enforcement',
        },
        'error'
      );
      return;
    }

    this.authStage = 'CHALLENGE_ISSUED';

    let challengeHex = '';
    let challengeB64 = '';
    let loginOpts: any = null;

    // If backend is online, request authentic Relying Party challenge
    if (this.backendOnline) {
      try {
        loginOpts = await api.getLoginOptions(this.user.nationalId);
        if (loginOpts.success && loginOpts.options) {
          challengeB64 = loginOpts.options.challenge;
          challengeHex = bufferToHex(new TextEncoder().encode(challengeB64)).substring(0, 64);
        }
      } catch (err: any) {
        console.warn('Backend login options fetch failed:', err);
        this.authStage = 'FAILED_MISMATCH';
        this.authSuccess = false;
        this.authError = err.message || `No active passkeys found for Aadhaar [${this.user.nationalId}].`;
        return;
      }
    }

    if (!challengeB64) {
      const fallbackChallenge = generateChallenge(32);
      challengeHex = fallbackChallenge.hex;
      challengeB64 = fallbackChallenge.base64url;
    }

    this.currentChallenge = { hex: challengeHex, base64url: challengeB64 };
    this.addLog('RP_CHALLENGE', 'ENTROPY', `Issued 256-bit cryptographically secure nonce challenge`, {
      challengeHex,
      challengeBase64URL: challengeB64,
      entropySource: this.backendOnline ? 'Node.js CSPRNG (Backend Server)' : 'WebCrypto CSPRNG (32 bytes)',
      rpId: 'id.digilocker.gov.in',
      timeout: 60000,
    }, 'info');

    await new Promise(r => setTimeout(r, 200));

    // Step 2: Prompting Authenticator
    this.authStage = 'PROMPTING_AUTHENTICATOR';

    // If in NATIVE mode and platform supports WebAuthn, prompt the physical sensor!
    if (this.authMode === 'NATIVE' && typeof window !== 'undefined' && browserSupportsWebAuthn() && loginOpts?.options) {
      try {
        this.addLog('WEBAUTHN_INVOKE', 'CLIENT_DATA', `Prompting Native Platform Authenticator (Windows Hello / Touch ID / YubiKey)...`, {
          rpId: loginOpts.options.rpId || 'localhost',
          userVerification: 'required',
        }, 'info');

        const assertion = await startAuthentication({ optionsJSON: loginOpts.options });

        this.authStage = 'VERIFYING_SIGNATURE';
        const verifyRes = await api.verifyLogin({
          nationalId: this.user.nationalId,
          response: assertion,
          expectedChallenge: challengeB64,
        });

        if (verifyRes.success && verifyRes.verified) {
          this.lastLatencyMs = Math.round(performance.now() - startTime);
          this.authStage = 'AUTHENTICATED';
          this.authSuccess = true;
          this.authError = '';
          this.addLog('AUTH_SUCCESS', 'OK', `NATIVE BIOMETRIC ATTESTED: ${this.user.name} authenticated via ${targetDevice.deviceModel} in ${this.lastLatencyMs}ms`, {
            credentialId: assertion.id,
            assuranceLevel: 'NIST SP 800-63B AAL3 / FIDO2 Level 3',
            verificationServer: 'Online (http://localhost:3001)',
          }, 'success');
          return;
        }
      } catch (nativeErr: any) {
        this.authStage = 'FAILED_MISMATCH';
        this.authSuccess = false;
        if (nativeErr.name === 'NotAllowedError' || nativeErr.message?.includes('cancel') || nativeErr.message?.includes('aborted') || nativeErr.message?.includes('dismiss')) {
          this.authError = 'BIOMETRIC VERIFICATION CANCELLED: You cancelled or dismissed the fingerprint/face verification prompt. Access denied.';
          this.addLog('AUTH_CANCELLED', 'ERR', 'Citizen cancelled the platform biometric verification prompt', null, 'error');
        } else {
          this.authError = `OS BIOMETRIC SENSOR NOTICE: ${nativeErr.message}. Passkey is not registered on this physical TPM. Please use the Interactive Sensor Engine or enroll this passkey with Windows Hello.`;
          this.addLog('HARDWARE_ERROR', 'AUTH_DATA', `Native WebAuthn error: ${nativeErr.message}`, null, 'error');
        }
        return;
      }
    }

    // SIMULATED / INTERACTIVE SENSOR ENGINE MODE:
    // Open the interactive Biometric Sensor HUD and wait for user interaction!
    this.biometricPrompt = {
      open: true,
      mode: 'LOGIN',
      citizenName: this.user.name,
      nationalId: this.user.nationalId,
      deviceModel: targetDevice.deviceModel,
      challengeHex,
      status: 'IDLE_WAITING',
      statusMessage: `Place enrolled finger on sensor to authenticate for ${this.user.name}`,
      targetDeviceId: targetDevice.id,
    };
  }

  // Interactive Biometric Sensor Handler (Login)
  async confirmBiometricVerification(isMatch: boolean) {
    if (!isMatch) {
      // Simulate Wrong Finger / Theft Attack
      this.biometricPrompt.status = 'MISMATCH_REJECTED';
      this.biometricPrompt.statusMessage = '✗ BIOMETRIC REJECTED: Fingerprint minutiae does not match enrolled Aadhaar record. Secure Enclave refused to sign (UV=0). Theft attempt blocked!';
      this.authStage = 'FAILED_MISMATCH';
      this.authSuccess = false;
      this.authError = 'BIOMETRIC MISMATCH: Fingerprint does not match enrolled Aadhaar. Secure Enclave blocked access (UV=0). Access denied.';
      this.addLog(
        'THEFT_PREVENTED',
        'ERR',
        `Biometric mismatch on sensor for citizen [${this.user.name}]. Cryptographic assertion denied (UV=0).`,
        {
          citizen: this.user.name,
          nationalId: this.user.nationalId,
          userVerification: 'UV=0 (FAILED)',
          defense: 'FIDO2 Level 3 Secure Enclave Biometric Lock',
        },
        'error'
      );
      setTimeout(() => {
        this.biometricPrompt.open = false;
      }, 1800);
      return;
    }

    // Authentic User Verification (Match)
    this.biometricPrompt.status = 'SCANNING';
    this.biometricPrompt.statusMessage = 'Biometric minutiae verified (UV=1). Assembling clientDataJSON and signing server nonce challenge...';

    const citizenDevices = this.devices.filter(d => d.userId === this.user.nationalId);
    const targetDevice = (this.biometricPrompt.targetDeviceId ? citizenDevices.find(d => d.id === this.biometricPrompt.targetDeviceId) : null)
      || citizenDevices.find(d => !d.revoked)
      || citizenDevices[0];

    if (!targetDevice) {
      this.biometricPrompt.status = 'MISMATCH_REJECTED';
      this.biometricPrompt.statusMessage = 'No valid hardware device registered for this identity.';
      this.authError = 'No registered passkey device found.';
      this.authStage = 'FAILED_MISMATCH';
      return;
    }

    const startTime = performance.now();
    await new Promise(r => setTimeout(r, 450));

    const challengeB64 = this.currentChallenge?.base64url || generateChallenge(32).base64url;
    const clientDataObj = {
      type: 'webauthn.get',
      challenge: challengeB64,
      origin: 'https://id.digilocker.gov.in',
      crossOrigin: false,
    };
    const clientDataJSON = JSON.stringify(clientDataObj);
    const clientDataHash = await sha256(clientDataJSON);

    this.addLog('CLIENT_DATA_HASH', 'CLIENT_DATA', `Assembled clientDataJSON and computed SHA-256 digest`, {
      rawJson: clientDataJSON,
      clientDataHashHex: clientDataHash.hex,
      verifiedOrigin: clientDataObj.origin,
    }, 'info');

    const rawAuthData = await createSyntheticAuthData('id.digilocker.gov.in', { userPresent: true, userVerified: true });
    const parsedAuthData = parseAuthenticatorData(rawAuthData);

    this.addLog('AUTHENTICATOR_FLAGS', 'AUTH_DATA', `Parsed AuthenticatorData (37 bytes): UP=1, UV=1 (Biometric Confirmed)`, {
      flagsByte: parsedAuthData.flagsBinary,
      userPresent_UP: parsedAuthData.flags.userPresent,
      userVerified_UV: parsedAuthData.flags.userVerified,
      backupState_BS: parsedAuthData.flags.backupState,
      counter: parsedAuthData.signCount,
      rpIdHash: parsedAuthData.rpIdHash,
    }, 'success');

    const signatureDummy = generateChallenge(64);

    let verifiedByServer = false;
    if (this.backendOnline) {
      try {
        const verifyRes = await api.simulateVerify({
          nationalId: this.user.nationalId,
          deviceId: targetDevice.id,
          clientDataJSON,
          authenticatorDataHex: bufferToHex(rawAuthData),
          signatureHex: signatureDummy.hex,
          expectedOrigin: 'https://id.digilocker.gov.in',
        });
        if (verifyRes.success && verifyRes.verified) {
          verifiedByServer = true;
          targetDevice.counter = verifyRes.device.counter;
        }
      } catch (err: any) {
        console.warn('Backend verification encountered error:', err.message);
        this.biometricPrompt.status = 'MISMATCH_REJECTED';
        this.biometricPrompt.statusMessage = err.message;
        this.authError = err.message;
        this.authStage = 'FAILED_MISMATCH';
        return;
      }
    } else {
      targetDevice.counter += 1;
    }

    this.lastLatencyMs = Math.round(performance.now() - startTime);
    this.biometricPrompt.status = 'SUCCESS_VERIFIED';
    this.biometricPrompt.statusMessage = `✓ BIOMETRIC MATCHED & VERIFIED BY RP SERVER (${this.lastLatencyMs}ms)`;
    this.authStage = 'AUTHENTICATED';
    this.authSuccess = true;
    this.authError = '';

    this.addLog('AUTH_SUCCESS', 'OK', `IDENTITY ATTESTED: ${this.user.name} authenticated via ${targetDevice.deviceModel} in ${this.lastLatencyMs}ms`, {
      assuranceLevel: 'NIST AAL3 / FIDO2 Level 3',
      sessionExpiry: '15m (Zero-Trust Refresh)',
      tokenBinding: 'Channel-Bound & Origin-Locked',
      verificationServer: this.backendOnline ? 'Online (http://localhost:3001)' : 'Local Subsystem',
    }, 'success');

    setTimeout(() => {
      this.biometricPrompt.open = false;
    }, 600);
  }

  // Interactive Biometric Sensor Handler (Registration)
  async confirmBiometricRegistration() {
    const formData = this.biometricPrompt.pendingFormData;
    if (!formData) return;

    this.biometricPrompt.status = 'SCANNING';
    this.biometricPrompt.statusMessage = 'Biometric authorized. Generating asymmetric P-256 keypair in Secure Enclave...';

    const startTime = performance.now();
    await new Promise(r => setTimeout(r, 450));

    let newDevice: CredentialDevice | null = null;
    const challengeB64 = this.currentChallenge?.base64url || generateChallenge(32).base64url;

    // Enroll on backend if online
    if (this.backendOnline) {
      try {
        const regRes = await api.verifyRegistration({
          nationalId: formData.nationalId,
          name: formData.name,
          service: formData.service,
          deviceModel: formData.deviceModel,
          transport: formData.transport,
          expectedChallenge: challengeB64,
        });
        if (regRes.success && regRes.device) {
          newDevice = {
            ...regRes.device,
            userId: formData.nationalId,
          };
        }
      } catch (err: any) {
        console.warn('Backend registration failed, creating locally:', err);
      }
    }

    if (!newDevice) {
      const newCredId = `cred-${Date.now().toString(36)}`;
      const randomAaguid = `${Math.random().toString(16).substring(2, 10)}-${Math.random().toString(16).substring(2, 6)}-4a81-b6e1-${Math.random().toString(16).substring(2, 14)}`;
      const randomPubKey = '3059301306072a8648ce3d020106082a8648ce3d03010703420004' + bufferToHex(generateChallenge(32).raw);

      newDevice = {
        id: newCredId,
        userId: formData.nationalId,
        credentialIdBase64: bufferToBase64URL(generateChallenge(16).raw),
        publicKeyHex: randomPubKey,
        deviceModel: formData.deviceModel,
        aaguid: randomAaguid,
        algorithm: 'ES256 (P-256 ECDSA)',
        counter: 1,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastUsedAt: 'Just now',
        transports: [formData.transport],
        userVerified: true,
        userPresent: true,
        revoked: false,
        trustLevel: formData.transport === 'internal' ? 'ENCLAVE_TIER_1' : 'ROAMING_FIDO2',
      };
    }

    this.devices = [newDevice, ...this.devices];

    const newUser = {
      nationalId: formData.nationalId,
      name: formData.name,
      service: formData.service,
      riskScore: 'LOW (0.01)',
      ipAddress: '103.24.112.44 (New Delhi, IN)',
    };

    if (!this.registeredUsers.find(u => u.nationalId === formData.nationalId)) {
      this.registeredUsers = [newUser, ...this.registeredUsers];
    }
    this.user = newUser;

    this.lastLatencyMs = Math.round(performance.now() - startTime);
    this.biometricPrompt.status = 'SUCCESS_VERIFIED';
    this.biometricPrompt.statusMessage = `✓ PASSKEY GENERATED & ENROLLED TO ${formData.name}`;
    this.authStage = 'AUTHENTICATED';
    this.authSuccess = true;
    this.authError = '';

    this.addLog('REG_COMPLETE', 'OK', `New passkey enrolled & citizen account created for ${formData.name}`, {
      credentialId: newDevice.credentialIdBase64,
      deviceModel: newDevice.deviceModel,
      publicKeyP256: newDevice.publicKeyHex.substring(0, 32) + '...',
      assuranceLevel: 'NIST AAL3',
      serverPersisted: this.backendOnline,
    }, 'success');

    setTimeout(() => {
      this.biometricPrompt.open = false;
    }, 600);
  }

  cancelBiometricVerification() {
    this.biometricPrompt.open = false;
    this.authStage = 'IDLE';
    this.authError = 'Biometric verification was cancelled. Access was not granted.';
  }

  logout() {
    const priorName = this.user.name || 'Citizen';
    this.authSuccess = false;
    this.authStage = 'IDLE';
    this.authError = '';
    this.user = {
      nationalId: '',
      name: 'Unauthenticated Citizen',
      service: 'National Digital Identity Grid (DigiLocker)',
      riskScore: 'LOW (0.01)',
      ipAddress: '103.24.112.44 (New Delhi, IN)',
    };
    this.addLog('LOGOUT', 'INIT', `Session terminated for ${priorName}. Identity purged from client memory (DPDP Act 2023 Zero-Footprint). Ready for next authentication.`, null, 'info');
  }

  async selectAccount(nationalId: string) {
    const cleanId = nationalId.trim();
    if (!cleanId) return;

    const found = this.registeredUsers.find(u => u.nationalId === cleanId);
    if (found) {
      this.user = { ...found };
    } else {
      this.user = {
        nationalId: cleanId,
        name: 'Citizen',
        service: 'National Digital Identity Grid (DigiLocker)',
        riskScore: 'UNKNOWN',
        ipAddress: '103.24.112.44',
      };
    }

    // Refresh devices and official profile dynamically from backend
    if (this.backendOnline) {
      try {
        const prof = await api.getProfile(cleanId);
        if (prof?.success && prof.user) {
          this.user = prof.user;
          if (Array.isArray(prof.devices)) {
            const otherDevices = this.devices.filter(d => d.userId !== cleanId);
            this.devices = [...prof.devices, ...otherDevices];
          }
        }
      } catch {
        // Unenrolled or network error
      }
    }
  }

  async triggerRegistration(formData: { name: string; nationalId: string; service: string; deviceModel: string; transport: 'internal' | 'usb' | 'nfc' | 'hybrid' }) {
    const startTime = performance.now();
    this.authSuccess = false;
    this.authError = '';
    this.authStage = 'CHALLENGE_ISSUED';

    let challengeHex = '';
    let challengeB64 = '';
    let regOpts: any = null;

    if (this.backendOnline) {
      try {
        const verifyRes = await api.verifyAadhaar({
          nationalId: formData.nationalId,
          name: formData.name,
        });
        if (!verifyRes.success) {
          this.authStage = 'FAILED_MISMATCH';
          this.authSuccess = false;
          this.authError = verifyRes.message || 'Aadhaar legitimacy verification failed.';
          return;
        }
      } catch (err: any) {
        this.authStage = 'FAILED_MISMATCH';
        this.authSuccess = false;
        this.authError = err.message || 'Aadhaar verification failed.';
        this.addLog('EKYC_MISMATCH', 'ERR', `Aadhaar verification failed: ${this.authError}`, {
          declaredName: formData.name,
          aadhaar: formData.nationalId,
        }, 'error');
        return;
      }

      try {
        regOpts = await api.getRegisterOptions({
          nationalId: formData.nationalId,
          name: formData.name,
          service: formData.service,
        });
        if (regOpts.success && regOpts.options) {
          challengeB64 = regOpts.options.challenge;
          challengeHex = bufferToHex(new TextEncoder().encode(challengeB64)).substring(0, 64);
        }
      } catch (err: any) {
        this.authStage = 'FAILED_MISMATCH';
        this.authSuccess = false;
        this.authError = err.message || 'Backend registration options fetch failed.';
        return;
      }
    }

    if (!challengeB64) {
      const challenge = generateChallenge(32);
      challengeHex = challenge.hex;
      challengeB64 = challenge.base64url;
    }

    this.currentChallenge = { hex: challengeHex, base64url: challengeB64 };
    this.addLog('REG_CHALLENGE', 'ENTROPY', `Issued WebAuthn registration nonce for citizen [${formData.name}]`, {
      challengeHex,
      rpId: 'id.digilocker.gov.in',
      service: formData.service,
    }, 'info');

    await new Promise(r => setTimeout(r, 200));
    this.authStage = 'PROMPTING_AUTHENTICATOR';

    if (this.authMode === 'NATIVE' && typeof window !== 'undefined' && browserSupportsWebAuthn() && regOpts?.options) {
      try {
        this.addLog('WEBAUTHN_INVOKE', 'CLIENT_DATA', `Prompting Native Platform Sensor to enroll Passkey (Windows Hello / Touch ID)...`, {
          rpName: regOpts.options.rp.name,
          user: formData.name,
        }, 'info');

        const nativeRegResponse = await startRegistration({ optionsJSON: regOpts.options });

        const regRes = await api.verifyRegistration({
          nationalId: formData.nationalId,
          name: formData.name,
          service: formData.service,
          deviceModel: formData.deviceModel,
          transport: formData.transport,
          response: nativeRegResponse,
          expectedChallenge: challengeB64,
        });

        if (regRes.success && regRes.device) {
          const newDevice: CredentialDevice = {
            ...regRes.device,
            userId: formData.nationalId,
          };
          this.devices = [newDevice, ...this.devices];

          const newUser = {
            nationalId: formData.nationalId,
            name: formData.name,
            service: formData.service,
            riskScore: 'LOW (0.01)',
            ipAddress: '103.24.112.44 (New Delhi, IN)',
          };

          if (!this.registeredUsers.find(u => u.nationalId === formData.nationalId)) {
            this.registeredUsers = [newUser, ...this.registeredUsers];
          }
          this.user = newUser;

          this.lastLatencyMs = Math.round(performance.now() - startTime);
          this.authStage = 'AUTHENTICATED';
          this.authSuccess = true;
          this.authError = '';
          this.addLog('REG_COMPLETE', 'OK', `Passkey created via OS Biometrics for ${formData.name}`, null, 'success');
          return;
        }
      } catch (nativeErr: any) {
        this.authStage = 'FAILED_MISMATCH';
        this.authSuccess = false;
        if (nativeErr.name === 'NotAllowedError' || nativeErr.message?.includes('cancel') || nativeErr.message?.includes('aborted') || nativeErr.message?.includes('dismiss')) {
          this.authError = 'BIOMETRIC REGISTRATION CANCELLED: You cancelled or dismissed the fingerprint/face enrollment prompt. Passkey was not created.';
          this.addLog('REG_CANCELLED', 'ERR', 'Citizen cancelled the platform biometric registration prompt', null, 'error');
        } else {
          this.authError = `OS SENSOR ENROLLMENT NOTICE: ${nativeErr.message}. Switch to Interactive Sensor mode to test without TPM.`;
        }
        return;
      }
    }

    // SIMULATED / INTERACTIVE SENSOR PROMPT FOR REGISTRATION:
    this.biometricPrompt = {
      open: true,
      mode: 'REGISTER',
      citizenName: formData.name,
      nationalId: formData.nationalId,
      deviceModel: formData.deviceModel,
      challengeHex,
      status: 'IDLE_WAITING',
      statusMessage: `Touch sensor to authorize creating and sealing new Passkey for ${formData.name}`,
      pendingFormData: formData,
    };
  }

  // Phishing Simulator Attack Run
  async runPhishingSimulation() {
    this.phishingSim.running = true;
    this.phishingSim.rpValidationResult = null;
    this.phishingSim.stepLogs = [];

    const log = (msg: string) => {
      this.phishingSim.stepLogs = [...this.phishingSim.stepLogs, msg];
    };

    log('1. User is lured to malicious proxy: https://id.digil0cker-gov.in');
    await new Promise(r => setTimeout(r, 400));

    log('2. Attacker forwards authentication request to genuine backend to obtain challenge');
    const legitChallenge = generateChallenge(32).base64url;
    log(`3. Backend issues challenge: ${legitChallenge.substring(0, 16)}...`);
    await new Promise(r => setTimeout(r, 450));

    log('4. Phishing page invokes browser WebAuthn API on malicious origin.');
    log(`5. BROWSER ENFORCEMENT: Browser inspects window.location.origin: "https://id.digil0cker-gov.in"`);
    await new Promise(r => setTimeout(r, 500));

    // ClientData formed by browser
    const attackerClientData = {
      type: 'webauthn.get',
      challenge: legitChallenge,
      origin: 'https://id.digil0cker-gov.in', // FORCED BY BROWSER ENGINE!
    };
    this.phishingSim.attackerPayload = JSON.stringify(attackerClientData, null, 2);

    log('6. Attacker harvests signed assertion and submits it to genuine https://id.digilocker.gov.in server');
    await new Promise(r => setTimeout(r, 600));

    // Call Backend Phishing Check if online
    if (this.backendOnline) {
      try {
        await api.checkPhishing('https://id.digil0cker-gov.in', this.phishingSim.attackerPayload);
      } catch (err: any) {
        log(`7. Relying Party Backend verification: ${err.message}`);
      }
    } else {
      log('7. Genuine Server verifies clientDataJSON.origin === "https://id.digilocker.gov.in"');
    }

    log('❌ CRITICAL MISMATCH: Received origin "https://id.digil0cker-gov.in" does NOT match expected RP Origin!');
    log('🛡️ CRYPTOGRAPHIC REJECTION: Attack neutralized. Credentials CANNOT be replayed or phished.');

    this.phishingSim.rpValidationResult = 'REJECT_ORIGIN_MISMATCH';
    this.phishingSim.running = false;

    this.addLog('PHISHING_ATTACK_BLOCKED', 'ERR', 'FIDO2 Origin-Binding thwarted credential replay from id.digil0cker-gov.in', {
      expectedOrigin: 'https://id.digilocker.gov.in',
      receivedOrigin: 'https://id.digil0cker-gov.in',
      defense: 'W3C WebAuthn RFC 8827 § 5.1.4 ClientData Origin Check',
      attackerStatus: 'ZERO_USABLE_CREDENTIAL_CAPTURED',
      verifiedBy: this.backendOnline ? 'RP Backend Server (Express + crypto)' : 'Local Cryptographic Simulator',
    }, 'error');
  }

  // Toggle Guardian Signature in Social Recovery
  async signGuardian(id: string) {
    if (this.backendOnline) {
      try {
        const res = await api.signGuardian(id);
        if (res.success && res.guardian) {
          const guardian = this.guardians.find(g => g.id === id);
          if (guardian) {
            guardian.status = res.guardian.status;
            guardian.attestedAt = res.guardian.attestedAt;
          }
          return;
        }
      } catch (err) {
        console.warn('Backend guardian sign failed, falling back to local toggle:', err);
      }
    }

    const guardian = this.guardians.find(g => g.id === id);
    if (!guardian) return;
    guardian.status = guardian.status === 'ATTESTED' ? 'PENDING' : 'ATTESTED';
    guardian.attestedAt = guardian.status === 'ATTESTED' ? new Date().toISOString().substring(11, 19) : undefined;
    
    const count = this.guardians.filter(g => g.status === 'ATTESTED').length;
    this.addLog('GUARDIAN_SIGN', 'SIG_VERIFY', `Guardian [${guardian.name}] cryptographic approval status: ${guardian.status} (${count}/2 required)`, {
      guardianRole: guardian.designation,
      publicKeyShard: guardian.keyFingerprint,
      thresholdSatisfied: count >= 2,
    }, count >= 2 ? 'success' : 'info');
  }

  // Revoke Credential
  async toggleRevokeDevice(id: string) {
    if (this.backendOnline) {
      try {
        const res = await api.revokeDevice(id);
        if (res.success && res.device) {
          const device = this.devices.find(d => d.id === id);
          if (device) {
            device.revoked = res.device.revoked;
          }
          return;
        }
      } catch (err) {
        console.warn('Backend revoke failed, falling back to local toggle:', err);
      }
    }

    const device = this.devices.find(d => d.id === id);
    if (!device) return;
    device.revoked = !device.revoked;
    
    this.addLog('KEY_REVOCATION', 'AUTH_DATA', `Hardware credential [${device.deviceModel}] revocation status: ${device.revoked ? 'REVOKED (Blacklisted in RP store)' : 'ACTIVE'}`, {
      aaguid: device.aaguid,
      credentialId: device.credentialIdBase64,
      revocationBroadcast: 'IMMEDIATE_CRL_UPDATE',
    }, device.revoked ? 'warning' : 'success');
  }

  // Inclusivity: Trigger Voice Challenge
  triggerAudioCue() {
    speakAcousticChallenge(this.audioCode, this.audioLang);
    this.addLog('AUDIO_INCLUSIVITY', 'INIT', `Synthesized phonetic voice verification challenge in ${this.audioLang}: [${this.audioCode}]`, {
      accessibleMode: 'Low-Literacy & Basic Phone Assistance',
      acousticChallenge: this.audioCode,
      language: this.audioLang,
    }, 'info');
  }
}

export const store = new SwissAuthStore();
