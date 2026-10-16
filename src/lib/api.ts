// Frontend API Client communicating with Relying Party (RP) Backend

const BASE_URL = '/api';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as T;
}

export const api = {
  // 1. Health
  async getHealth() {
    return await fetchJSON<{
      status: string;
      service: string;
      rpName: string;
      rpId: string;
      compliance: string;
      uptimeSeconds: number;
      registeredCitizens: number;
      activeCredentials: number;
    }>('/health');
  },

  // 2. Auth & Profiles
  async getUsers() {
    return await fetchJSON<{ success: boolean; users: any[] }>('/auth/users');
  },

  async getProfile(nationalId: string) {
    return await fetchJSON<{ success: boolean; user: any; devices: any[] }>(`/auth/profile/${encodeURIComponent(nationalId)}`);
  },

  async verifyAadhaar(data: { nationalId: string; name: string }) {
    return await fetchJSON<{
      success: boolean;
      verified: boolean;
      officialName: string;
      aadhaar: string;
      state: string;
      maskedPhone: string;
      verhoeffValid: boolean;
      eKycToken: string;
      message: string;
    }>('/auth/verify-aadhaar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRegisterOptions(data: { nationalId: string; name: string; service: string }) {
    return await fetchJSON<{ success: boolean; options: any }>('/auth/register-options', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyRegistration(data: {
    nationalId: string;
    name: string;
    service: string;
    deviceModel: string;
    transport: string;
    response?: any;
    expectedChallenge: string;
  }) {
    return await fetchJSON<{ success: boolean; verified: boolean; user: any; device: any }>('/auth/register-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getLoginOptions(nationalId?: string) {
    return await fetchJSON<{ success: boolean; options: any; devices: any[] }>('/auth/login-options', {
      method: 'POST',
      body: JSON.stringify({ nationalId }),
    });
  },

  async verifyLogin(data: { nationalId: string; response: any; expectedChallenge: string }) {
    return await fetchJSON<{
      success: boolean;
      verified: boolean;
      latencyMs: number;
      user: any;
      device: any;
      sessionToken: string;
    }>('/auth/login-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async simulateVerify(payload: {
    nationalId: string;
    deviceId: string;
    clientDataJSON: string;
    authenticatorDataHex: string;
    signatureHex?: string;
    expectedOrigin?: string;
  }) {
    return await fetchJSON<{
      success: boolean;
      verified: boolean;
      latencyMs: number;
      user: any;
      device: any;
      sessionToken: string;
    }>('/auth/simulate-verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async checkPhishing(receivedOrigin: string, attackerPayload: string) {
    return await fetchJSON<{
      success: boolean;
      result: 'PASS' | 'REJECT_ORIGIN_MISMATCH';
      expectedOrigin: string;
      receivedOrigin: string;
      message: string;
    }>('/auth/phishing-check', {
      method: 'POST',
      body: JSON.stringify({ receivedOrigin, attackerPayload }),
    });
  },

  // 3. Devices
  async getDevices(userId?: string) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await fetchJSON<{ success: boolean; devices: any[] }>(`/devices${q}`);
  },

  async enrollDevice(data: { userId: string; deviceModel: string; transport: string }) {
    return await fetchJSON<{ success: boolean; device: any }>('/devices/enroll', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async revokeDevice(id: string) {
    return await fetchJSON<{ success: boolean; device: any }>(`/devices/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
    });
  },

  async deleteDevice(id: string) {
    return await fetchJSON<{ success: boolean; message: string }>(`/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // 4. Social Recovery & Paper Key
  async getGuardians() {
    return await fetchJSON<{
      success: boolean;
      guardians: any[];
      threshold: number;
      total: number;
      attestedCount: number;
      thresholdSatisfied: boolean;
    }>('/recovery/guardians');
  },

  async signGuardian(id: string) {
    return await fetchJSON<{
      success: boolean;
      guardian: any;
      attestedCount: number;
      thresholdSatisfied: boolean;
      recoveryToken: string | null;
    }>('/recovery/guardians/sign', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async verifyMnemonic(words: string[]) {
    return await fetchJSON<{
      success: boolean;
      verified: boolean;
      recoveryToken?: string;
    }>('/recovery/verify-mnemonic', {
      method: 'POST',
      body: JSON.stringify({ words }),
    });
  },

  // 5. Village Kiosk
  async createKioskSession(sessionId = 'CSC-VLE-UP-7029', audioLang = 'en-IN') {
    return await fetchJSON<{ success: boolean; session: any }>('/kiosk/session', {
      method: 'POST',
      body: JSON.stringify({ sessionId, audioLang }),
    });
  },

  async getKioskSession(sessionId: string) {
    return await fetchJSON<{ success: boolean; session: any }>(`/kiosk/session/${encodeURIComponent(sessionId)}`);
  },

  async scanKioskSession(sessionId: string) {
    return await fetchJSON<{ success: boolean; session: any }>(`/kiosk/session/${encodeURIComponent(sessionId)}/scan`, {
      method: 'POST',
    });
  },

  async authorizeKioskSession(sessionId: string) {
    return await fetchJSON<{ success: boolean; session: any }>(`/kiosk/session/${encodeURIComponent(sessionId)}/authorize`, {
      method: 'POST',
    });
  },

  async resetKioskSession(sessionId: string) {
    return await fetchJSON<{ success: boolean; session: any }>(`/kiosk/session/${encodeURIComponent(sessionId)}/reset`, {
      method: 'POST',
    });
  },

  // 6. Telemetry & Logs
  async getTelemetry() {
    return await fetchJSON<{ success: boolean; logs: any[]; count: number }>('/telemetry');
  },

  async postTelemetryLog(log: any) {
    return await fetchJSON<{ success: boolean; log: any }>('/telemetry/log', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  async clearTelemetry() {
    return await fetchJSON<{ success: boolean; logs: any[] }>('/telemetry/clear', {
      method: 'POST',
    });
  },
};
