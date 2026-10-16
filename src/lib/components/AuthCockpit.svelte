<script lang="ts">
  import { store } from '../store.svelte';
  import BiometricSensorModal from './BiometricSensorModal.svelte';
  import { validateAadhaarInput, speakVoiceGuide } from '../cryptoEngine';
  import { api } from '../api';

  let activeMode = $state<'LOGIN' | 'CREATE_ACCOUNT'>('LOGIN');

  // Login identification mode (Default: MANUAL for Zero-Footprint privacy)
  let idMode = $state<'SELECT' | 'MANUAL'>('MANUAL');
  let manualAadhaarInput = $state('');

  // Active target Aadhaar and device resolution
  let activeTargetAadhaar = $derived(idMode === 'MANUAL' ? manualAadhaarInput.trim() : store.user.nationalId);
  let citizenDevices = $derived(store.devices.filter(d => d.userId === activeTargetAadhaar));
  let hasPasskeys = $derived(activeTargetAadhaar !== '' && citizenDevices.length > 0);
  let selectedDeviceId = $state('');
  let activeDevice = $derived(
    citizenDevices.find(d => d.id === selectedDeviceId) || 
    citizenDevices[0] || 
    store.devices[0] || {
      id: 'unregistered',
      deviceModel: 'Hardware Passkey (FIDO2 Authenticator)',
      transports: ['internal'],
      publicKeyHex: 'Hardware Key Required',
      aaguid: '00000000-0000-0000-0000-000000000000',
      trustLevel: 'ENCLAVE_TIER_1',
    }
  );
  let selectedUserId = $state('');

  // Registration state
  let regName = $state('');
  let regNationalId = $state('');
  let regService = $state('National Digital Identity Grid (DigiLocker)');
  let regDeviceModel = $state('Apple Silicon Secure Enclave (Touch ID)');
  let regTransport = $state<'internal' | 'usb' | 'nfc' | 'hybrid'>('internal');
  let regError = $state('');

  // e-KYC Legitimacy Check State
  let kycVerifying = $state(false);
  let kycVerified = $state(false);
  let kycResult = $state<{
    officialName: string;
    aadhaar: string;
    eKycToken: string;
    state: string;
    maskedPhone: string;
    verhoeffValid: boolean;
  } | null>(null);

  // Live input validation
  let aadhaarStatus = $derived(validateAadhaarInput(regNationalId));

  async function handleAuthClick() {
    if (idMode === 'MANUAL') {
      const cleanAadhaar = manualAadhaarInput.trim();
      if (!cleanAadhaar) {
        store.authError = 'Please enter your 12-digit Aadhaar number to authenticate.';
        return;
      }
      await handleManualLookup();
    }
    store.triggerAuthentication(selectedDeviceId);
  }

  async function handleAccountSelect(e: Event) {
    const target = e.target as HTMLSelectElement;
    selectedUserId = target.value;
    manualAadhaarInput = target.value;
    await store.selectAccount(target.value);
    store.authError = '';
    const userDevs = store.devices.filter(d => d.userId === target.value);
    selectedDeviceId = userDevs.length > 0 ? userDevs[0].id : '';
  }

  async function handleManualLookup() {
    const aadhaar = manualAadhaarInput.trim();
    if (!aadhaar) return;
    selectedUserId = aadhaar;
    await store.selectAccount(aadhaar);
    store.authError = '';
    const userDevs = store.devices.filter(d => d.userId === aadhaar);
    selectedDeviceId = userDevs.length > 0 ? userDevs[0].id : '';
  }

  async function handleVerifyLegitimacy() {
    if (!regName.trim()) {
      regError = 'Please enter your citizen name first.';
      return;
    }
    if (!regNationalId.trim()) {
      regError = 'Please enter your Aadhaar number.';
      return;
    }
    regError = '';
    kycVerifying = true;

    try {
      const res = await api.verifyAadhaar({
        nationalId: regNationalId.trim(),
        name: regName.trim(),
      });
      if (res.success && res.verified) {
        kycVerified = true;
        kycResult = {
          officialName: res.officialName,
          aadhaar: res.aadhaar,
          eKycToken: res.eKycToken,
          state: res.state,
          maskedPhone: res.maskedPhone,
          verhoeffValid: res.verhoeffValid,
        };
        regError = '';
      }
    } catch (err: any) {
      kycVerified = false;
      kycResult = null;
      regError = err.message || 'UIDAI e-KYC validation failed.';
    } finally {
      kycVerifying = false;
    }
  }

  function handleCreateAccount() {
    if (!regName.trim()) {
      regError = 'Please enter your full citizen name.';
      return;
    }
    if (!regNationalId.trim()) {
      regError = 'Please enter your National ID / Aadhaar.';
      return;
    }
    regError = '';

    store.triggerRegistration({
      name: regName.trim(),
      nationalId: regNationalId.trim(),
      service: regService,
      deviceModel: regDeviceModel,
      transport: regTransport,
    });
  }

  function prefillDemoCitizen(type: 'priya' | 'arjun' | 'tamper_test') {
    kycVerified = false;
    kycResult = null;
    regError = '';
    if (type === 'priya') {
      regName = 'Priya Patel';
      regNationalId = '551288014432';
      regService = 'Direct Benefit Transfer (DBT)';
      regDeviceModel = 'Google Titan M2 Security Chip (Pixel 8)';
      regTransport = 'internal';
    } else if (type === 'arjun') {
      regName = 'Arjun Sundaram';
      regNationalId = '774099211205';
      regService = 'National Digital Identity Grid (DigiLocker)';
      regDeviceModel = 'Yubico YubiKey 5C NFC (FIDO2 Hardware Token)';
      regTransport = 'usb';
    } else {
      // Impersonation Attack Test: Vikram claiming Dhruv Yadav's Aadhaar!
      regName = 'Vikram Malhotra';
      regNationalId = '380563080624';
      regService = 'National Digital Identity Grid (DigiLocker)';
      regDeviceModel = 'Apple Silicon Secure Enclave (Touch ID)';
      regTransport = 'internal';
    }
  }
</script>

<div class="min-h-[calc(100vh-84px)] bg-[#08090c] flex flex-col items-center justify-center p-4 sm:p-8">
  
  <!-- MAIN WORKSTATION CARD: Swiss Precision, Matte Surfaces -->
  <div class="w-full max-w-lg bg-[#0e1016] hairline-border p-6 sm:p-8 flex flex-col relative shadow-2xl">
    
    <!-- Top Mode Switcher Bar -->
    <div class="flex items-center justify-between text-[11px] font-mono hairline-b pb-3 mb-6">
      <div class="flex items-center gap-1 bg-[#06070a] p-1 hairline-border">
        <button
          onclick={() => { activeMode = 'LOGIN'; }}
          class="px-3 py-1 font-mono text-[11px] font-bold tracking-wider transition-colors cursor-pointer
            {activeMode === 'LOGIN' ? 'bg-[#1b1f2b] text-white hairline-border' : 'text-[#727a8c] hover:text-white'}"
        >
          01. LOG IN
        </button>
        <button
          onclick={() => { activeMode = 'CREATE_ACCOUNT'; }}
          class="px-3 py-1 font-mono text-[11px] font-bold tracking-wider transition-colors cursor-pointer
            {activeMode === 'CREATE_ACCOUNT' ? 'bg-[#1b1f2b] text-white hairline-border' : 'text-[#727a8c] hover:text-white'}"
        >
          02. CREATE ACCOUNT
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-[#00d68f]"></span>
        <span class="text-[#00ff99] font-medium font-mono text-[10px]">BANK-GRADE (AAL3)</span>
      </div>
    </div>

    {#if store.authSuccess}
      <!-- LOGGED-IN / VERIFIED CITIZEN DASHBOARD STATE -->
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Verification Banner -->
        <div class="p-3.5 bg-[#003822] hairline-border border-[#00663e] text-[#00ff99] font-mono text-[11px] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-[#00ff99]"></span>
            <span class="font-bold tracking-wider">IDENTITY VERIFIED & SESSION ACTIVE ({store.lastLatencyMs}ms)</span>
          </div>
          <span class="text-[9px] bg-[#004d2e] px-2 py-0.5 text-white font-bold">ACCESS GRANTED</span>
        </div>

        <!-- Citizen Profile Card -->
        <div class="p-5 bg-[#08090d] hairline-border space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-[10px] font-mono text-[#555d6e] uppercase tracking-wider">Authenticated Citizen</div>
              <div class="text-xl font-bold font-sans text-white mt-0.5">{store.user.name}</div>
              <div class="text-[11px] font-mono text-[#8e98aa] mt-0.5">{store.user.nationalId}</div>
            </div>
            <div class="w-10 h-10 bg-[#0052ff] flex items-center justify-center text-white font-bold font-mono text-sm">
              ✓
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 hairline-t font-mono text-[11px] text-[#788295]">
            <div>
              <div class="text-[#474e5e] text-[10px]">PORTAL SERVICE</div>
              <div class="text-[#e2e5ec] font-medium">{store.user.service}</div>
            </div>
            <div>
              <div class="text-[#474e5e] text-[10px]">KEY TOKEN USED</div>
              <div class="text-[#00ff99] font-medium">{activeDevice.deviceModel}</div>
            </div>
            <div>
              <div class="text-[#474e5e] text-[10px]">ASSURANCE LEVEL</div>
              <div class="text-[#e2e5ec]">NIST SP 800-63B AAL3</div>
            </div>
            <div>
              <div class="text-[#474e5e] text-[10px]">RISK VERDICT</div>
              <div class="text-[#00ff99]">LOW (Zero Anomalies)</div>
            </div>
          </div>
        </div>

        <!-- Registered Public Key Snippet -->
        <div class="p-3 bg-[#06070a] hairline-border space-y-1 font-mono text-[10px]">
          <div class="text-[#555d6e] uppercase flex justify-between">
            <span>Hardware Public Key (P-256)</span>
            <span class="text-[#00ff99]">Zero Password Stored</span>
          </div>
          <div class="text-[#8e98aa] break-all select-all">
            {activeDevice.publicKeyHex}
          </div>
        </div>

        <!-- Actions Strip -->
        <div class="grid grid-cols-2 gap-3">
          <button
            onclick={() => store.activeTab = 'PHISHING'}
            class="py-2.5 px-3 bg-[#131720] hover:bg-[#1a202c] text-white font-mono text-xs hairline-border cursor-pointer transition-colors"
          >
            TEST PHISHING DEFENSE →
          </button>
          <button
            onclick={() => store.activeTab = 'ADMIN'}
            class="py-2.5 px-3 bg-[#131720] hover:bg-[#1a202c] text-white font-mono text-xs hairline-border cursor-pointer transition-colors"
          >
            MANAGE ALL DEVICES →
          </button>
        </div>

        <!-- Logout Action Button (Purges all identity from local memory) -->
        <button
          onclick={() => {
            store.logout();
            manualAadhaarInput = '';
            selectedUserId = '';
          }}
          class="w-full py-3 bg-[#241216] hover:bg-[#38161d] active:bg-[#481c25] text-[#ff6174] font-mono text-xs font-bold uppercase tracking-wider hairline-border cursor-pointer transition-colors flex items-center justify-center gap-2"
        >
          <span>LOG OUT (PURGE SESSION & ZERO LOCAL FOOTPRINT)</span>
        </button>

      </div>

    {:else if activeMode === 'LOGIN'}
      <!-- MODE 1: LOG IN TO EXISTING ACCOUNT -->
      <div class="space-y-5">
        
        <!-- Header -->
        <header>
          <h1 class="text-3xl font-extrabold text-[#f4f6fb] tracking-tight font-sans uppercase">
            Log in with Passkey
          </h1>
          <p class="text-sm font-sans text-[#788194] mt-1 font-normal">
            No passwords. No 6-digit SMS OTPs. Touch your fingerprint sensor, use Face ID, or tap your hardware key.
          </p>
        </header>

        {#if store.authError}
          <div class="p-3.5 bg-[#381014] hairline-border border-[#5e1e27] text-[#ff6b7d] font-mono text-xs space-y-1.5 animate-fadeIn">
            <div class="flex items-center justify-between">
              <div class="font-bold uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 bg-[#ff3344]"></span>
                <span>VERIFICATION BLOCKED / ACCESS DENIED</span>
              </div>
              <button type="button" onclick={() => store.authError = ''} class="text-[#883344] hover:text-white cursor-pointer">[DISMISS]</button>
            </div>
            <div class="text-[11px] text-[#ff99a6] leading-relaxed">{store.authError}</div>
          </div>
        {/if}

        <!-- Authenticator Sensor Engine Toggle -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono p-2 bg-[#07080c] hairline-border">
          <div class="flex items-center gap-1.5 text-[#8a94a6]">
            <span class="w-1.5 h-1.5 {store.authMode === 'NATIVE' ? 'bg-[#00ff99]' : 'bg-[#56bbf5]'}"></span>
            <span class="uppercase tracking-wider">SENSOR ENGINE:</span>
          </div>
          <div class="flex items-center gap-1 bg-[#06070a] p-0.5 hairline-border">
            <button
              type="button"
              onclick={() => { store.authMode = 'NATIVE'; store.authError = ''; }}
              class="px-2 py-0.5 transition-colors cursor-pointer {store.authMode === 'NATIVE' ? 'bg-[#1b1f2b] text-[#00ff99] font-bold hairline-border border-[#00663e]' : 'text-[#6c7485] hover:text-white'}"
              title="Prompts physical Windows Hello / Touch ID sensor"
            >
              NATIVE (WINDOWS HELLO / TOUCH ID)
            </button>
            <button
              type="button"
              onclick={() => { store.authMode = 'SIMULATED'; store.authError = ''; }}
              class="px-2 py-0.5 transition-colors cursor-pointer {store.authMode === 'SIMULATED' ? 'bg-[#1b1f2b] text-[#56bbf5] font-bold hairline-border border-[#22445b]' : 'text-[#6c7485] hover:text-white'}"
              title="Runs virtual enclave cryptographic simulation"
            >
              VIRTUAL SIMULATOR
            </button>
          </div>
        </div>

        <!-- Citizen Profile Identification (Direct Entry vs Evaluator Presets) -->
        <div class="space-y-2 font-mono text-xs">
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-[#6c7485] uppercase tracking-wider font-bold">CITIZEN IDENTITY</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => { idMode = 'MANUAL'; store.authError = ''; }}
                class="cursor-pointer {idMode === 'MANUAL' ? 'text-[#00ff99] font-bold underline' : 'text-[#6c7485] hover:text-white'}"
                title="Privacy mode: Enter your Aadhaar directly without saving on device"
              >
                [DIRECT AADHAAR ENTRY]
              </button>
              <span class="text-[#3a4050]">•</span>
              <button
                type="button"
                onclick={() => { 
                  idMode = 'SELECT'; 
                  store.authError = '';
                  if (store.registeredUsers.length > 0 && !selectedUserId) {
                    selectedUserId = store.registeredUsers[0].nationalId;
                    store.selectAccount(selectedUserId);
                  }
                }}
                class="cursor-pointer {idMode === 'SELECT' ? 'text-[#00ff99] font-bold underline' : 'text-[#6c7485] hover:text-white'}"
                title="Demo testing presets for hackathon evaluators"
              >
                [EVALUATOR PRESETS]
              </button>
            </div>
          </div>

          {#if idMode === 'SELECT'}
            <div class="space-y-2">
              <label for="citizen-account-select" class="sr-only">Select Enrolled Citizen Profile</label>
              <select
                id="citizen-account-select"
                value={selectedUserId}
                onchange={handleAccountSelect}
                class="w-full p-2.5 bg-[#08090d] text-white hairline-border text-xs font-mono focus:outline-none cursor-pointer"
              >
                {#each store.registeredUsers as u}
                  <option value={u.nationalId}>{u.name} — ({u.nationalId})</option>
                {/each}
              </select>
              <div class="text-[10px] text-[#555d6e]">
                Demo Mode: Evaluator quick-switch among enrolled identities.
              </div>
            </div>
          {:else}
            <div class="space-y-2">
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={manualAadhaarInput}
                  oninput={() => {
                    const clean = manualAadhaarInput.trim().replace(/\D/g, '');
                    if (clean.length === 12) {
                      handleManualLookup();
                    }
                  }}
                  onkeydown={(e) => { if (e.key === 'Enter') handleAuthClick(); }}
                  placeholder="Enter 12-digit Aadhaar (e.g. 380563080624)"
                  class="flex-1 p-2.5 bg-[#08090d] text-white hairline-border text-xs font-mono focus:outline-none placeholder-[#3e4659]"
                />
                <button
                  type="button"
                  onclick={handleManualLookup}
                  class="px-4 bg-[#181d28] hover:bg-[#252c3d] text-white font-mono text-[11px] font-bold hairline-border cursor-pointer transition-colors"
                >
                  LOOKUP PASSKEY
                </button>
              </div>

              <!-- Zero Footprint Privacy Badge with Voice Assistance -->
              <div class="p-2 bg-[#06080d] hairline-border border-[#141b26] flex items-center justify-between text-[10px] text-[#7888a5] font-mono">
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 bg-[#00ff99] rounded-full"></span>
                  <span class="text-white font-bold">ZERO-FOOTPRINT PRIVACY</span>
                  <span class="text-[#4e586d] hidden sm:inline">• NO LOCAL STORAGE (DPDP ACT 2023)</span>
                </div>
                <button
                  type="button"
                  onclick={() => speakVoiceGuide('अपना बारह अंकों का आधार नंबर दर्ज करें और बायोमेट्रिक सेंसर स्पर्श करें', 'hi-IN')}
                  class="text-[#00ff99] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  title="Listen to spoken instructions in Hindi"
                >
                  <span>🔊</span>
                  <span>सुनें (AUDIO GUIDE)</span>
                </button>
              </div>
            </div>
          {/if}
        </div>

        {#if !activeTargetAadhaar}
          <!-- READY STATE: Direct Aadhaar Prompt -->
          <div class="p-4 bg-[#090b10] hairline-border border-[#181d28] text-[#8e9cb5] font-mono text-xs space-y-2">
            <div class="font-bold flex items-center gap-2 text-white text-xs">
              <span class="w-2 h-2 bg-[#00ff99]"></span>
              <span>READY FOR BIOMETRIC AUTHENTICATION</span>
            </div>
            <p class="text-[11px] text-[#717f99] leading-relaxed">
              Enter your 12-digit Aadhaar number above to authenticate. Since UIDAI e-KYC was already completed at enrollment, you will be prompted directly for your fingerprint or Face ID. Zero personal credentials are stored on this machine.
            </p>
          </div>
        {:else if !hasPasskeys}
          <!-- NO ENROLLED PASSKEY FOR THIS CITIZEN NOTICE -->
          <div class="p-4 bg-[#21120f] hairline-border border-[#5e221d] text-[#ff9980] font-mono text-xs space-y-2.5 animate-fadeIn">
            <div class="font-bold flex items-center gap-2 text-white text-sm">
              <span class="w-2.5 h-2.5 bg-[#ff4d36]"></span>
              <span>NO PASSKEY ENROLLED FOR THIS AADHAAR</span>
            </div>
            <p class="text-[11px] text-[#cca197] leading-relaxed">
              Aadhaar <strong>{activeTargetAadhaar}</strong> does not have an enrolled biometric passkey on this Relying Party yet. 
              Under FIDO2 Level 3 (NIST SP 800-63B AAL3), login is mathematically blocked until a hardware passkey is bound.
            </p>
            <button
              type="button"
              onclick={() => {
                regName = '';
                regNationalId = activeTargetAadhaar;
                activeMode = 'CREATE_ACCOUNT';
                store.authError = '';
              }}
              class="w-full py-2.5 bg-[#ff4d36] hover:bg-[#e03d27] text-white font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer"
            >
              + ENROLL PASSKEY FOR THIS CITIZEN IN 02. CREATE ACCOUNT
            </button>
          </div>
        {:else}
          <!-- Active Hardware Authenticator Selector -->
          <div class="space-y-2">
            <div class="text-[10px] font-mono text-[#6c7485] uppercase tracking-wider flex items-center justify-between">
              <span>Choose Your Authentication Device</span>
              <span class="text-[#00ff99]">Aadhaar: {activeTargetAadhaar}</span>
            </div>
            <div class="space-y-2">
              {#each citizenDevices.filter(d => !d.revoked) as device}
                <button
                  type="button"
                  onclick={() => selectedDeviceId = device.id}
                  class="w-full text-left p-3 hairline-border transition-all flex items-center justify-between cursor-pointer
                    {selectedDeviceId === device.id 
                      ? 'bg-[#151922] border-[#2f374a] text-white' 
                      : 'bg-[#090b10] border-[#181b24] text-[#7d8698] hover:bg-[#10131b]'}"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-none {selectedDeviceId === device.id ? 'bg-[#0052ff]' : 'bg-[#2b3040]'}"></div>
                    <div>
                      <div class="text-[12px] font-mono font-bold text-white tracking-tight">{device.deviceModel}</div>
                      <div class="text-[10px] font-mono text-[#5c6475]">Hardware Key • {device.transports.join(', ').toUpperCase()}</div>
                    </div>
                  </div>
                  <span class="text-[9px] font-mono px-1.5 py-0.5 bg-[#050608] hairline-border text-[#00ff99]">
                    READY
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- PRIMARY ACTION: Large Solid Blue Button -->
        <div>
          <button
            onclick={handleAuthClick}
            disabled={store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE' || (activeTargetAadhaar !== '' && !hasPasskeys)}
            class="w-full py-4 px-6 bg-[#0052ff] hover:bg-[#0047e0] active:bg-[#003bc4] text-white font-sans font-bold text-base tracking-wide uppercase transition-all duration-100 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
          >
            {#if !activeTargetAadhaar}
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="square" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z"/>
              </svg>
              <span class="font-sans text-[15px] font-extrabold tracking-wider">ENTER AADHAAR TO LOG IN</span>
            {:else if !hasPasskeys}
              <span class="font-mono text-sm tracking-wider text-[#ffb8a6]">ENROLLMENT REQUIRED (NO PASSKEY)</span>
            {:else if store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE'}
              <span class="w-4 h-4 border-2 border-[#2b354d] border-t-white animate-spin"></span>
              <span class="font-mono text-sm tracking-wider">
                {store.authMode === 'NATIVE' ? 'PROMPTING WINDOWS HELLO / TOUCH ID...' : 'WAITING FOR SENSOR TOUCH...'}
              </span>
            {:else}
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="square" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z"/>
              </svg>
              <span class="font-sans text-[15px] font-extrabold tracking-wider">
                {store.authMode === 'NATIVE' ? 'VERIFY WITH WINDOWS HELLO / TOUCH ID' : 'LOG IN WITH FINGERPRINT / FACE ID'}
              </span>
            {/if}
          </button>
        </div>

        <!-- Quick Switch to Registration Link -->
        <div class="pt-3 hairline-t flex items-center justify-between text-[11px] font-mono text-[#5b6375]">
          <span>New citizen or device?</span>
          <button 
            onclick={() => activeMode = 'CREATE_ACCOUNT'}
            class="text-[#0052ff] hover:underline font-semibold cursor-pointer"
          >
            CREATE ACCOUNT WITH PASSKEY →
          </button>
        </div>

      </div>

    {:else}
      <!-- MODE 2: CREATE ACCOUNT (ENROLL NEW CITIZEN WITH PASSKEY) -->
      <div class="space-y-5 animate-fadeIn">
        
        <header>
          <h1 class="text-3xl font-extrabold text-[#f4f6fb] tracking-tight font-sans uppercase">
            Create Passkey Account
          </h1>
          <p class="text-sm font-sans text-[#788194] mt-1 font-normal">
            Enroll your digital identity. Your device will generate an asymmetric cryptographic key pair directly on your hardware chip.
          </p>
        </header>

        <!-- Fast Demo Quick-Fills -->
        <div class="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#6c7485]">
          <span>Quick Demo Fill:</span>
          <button
            type="button"
            onclick={() => prefillDemoCitizen('priya')}
            class="text-[#0052ff] hover:underline cursor-pointer"
          >
            [Priya Patel - Official]
          </button>
          <span>•</span>
          <button
            type="button"
            onclick={() => prefillDemoCitizen('arjun')}
            class="text-[#0052ff] hover:underline cursor-pointer"
          >
            [Arjun Sundaram - Official]
          </button>
          <span>•</span>
          <button
            type="button"
            onclick={() => prefillDemoCitizen('tamper_test')}
            class="text-[#ff4d36] hover:underline cursor-pointer font-bold"
            title="Tests what happens when Vikram tries to bind his fingerprint to Dhruv Yadav's Aadhaar!"
          >
            [Impersonation Attack Test]
          </button>
        </div>

        {#if regError}
          <div class="p-3 bg-[#381014] text-[#ff6174] font-mono text-[11px] hairline-border border-[#5e1e27] space-y-1 animate-fadeIn">
            <div class="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 bg-[#ff3344]"></span>
              <span>VERIFICATION FAILED / REGISTRATION BLOCKED</span>
            </div>
            <div class="text-[10px] text-[#ff99a6] leading-relaxed">{regError}</div>
          </div>
        {/if}

        <!-- Registration Inputs Form -->
        <div class="space-y-3 font-mono text-xs">
          <div>
            <label for="reg-name" class="block text-[10px] text-[#555d6e] uppercase mb-1">
              Citizen Official Name
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Dhruv Yadav"
              bind:value={regName}
              oninput={() => { kycVerified = false; kycResult = null; regError = ''; }}
              class="w-full p-2.5 bg-[#08090d] hairline-border text-white text-xs font-mono focus:outline-none"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="reg-id" class="block text-[10px] text-[#555d6e] uppercase">
                12-Digit Aadhaar / National ID
              </label>
              <span class="text-[9px] font-mono {aadhaarStatus.valid ? 'text-[#00ff99]' : 'text-[#8e98aa]'}">
                {aadhaarStatus.message}
              </span>
            </div>
            <div class="flex gap-2">
              <input
                id="reg-id"
                type="text"
                placeholder="e.g. 380563080624 or 551288014432"
                bind:value={regNationalId}
                oninput={() => { kycVerified = false; kycResult = null; regError = ''; }}
                class="flex-1 p-2.5 bg-[#08090d] hairline-border text-white text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                onclick={handleVerifyLegitimacy}
                disabled={kycVerifying || !regNationalId || !regName}
                class="px-3 bg-[#181d28] hover:bg-[#252c3d] text-[#00ff99] text-[10px] font-bold font-mono hairline-border cursor-pointer transition-colors disabled:opacity-40"
              >
                {kycVerifying ? 'VERIFYING...' : 'VERIFY e-KYC'}
              </button>
            </div>
          </div>

          {#if kycVerified && kycResult}
            <!-- AADHAAR LEGITIMACY VERIFIED BADGE -->
            <div class="p-3 bg-[#003822] hairline-border border-[#00663e] text-[#00ff99] space-y-1.5 text-[11px] animate-fadeIn">
              <div class="font-bold flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 bg-[#00ff99]"></span>
                  <span>UIDAI e-KYC VERIFIED: {kycResult.officialName}</span>
                </span>
                <span class="text-[9px] bg-[#004d2e] px-1.5 py-0.5 text-white font-bold">LEGITIMACY CONFIRMED</span>
              </div>
              <div class="text-[10px] text-[#99ffd6] space-y-0.5 pt-1.5 hairline-t border-[#004d2e]">
                <div>Official Government Record: <strong>{kycResult.officialName}</strong> ({kycResult.state})</div>
                <div>Masked Linked Phone: <strong>{kycResult.maskedPhone}</strong> (Possession Proved)</div>
                <div class="font-mono text-[9px] text-[#66cca6] truncate">Proof Token: {kycResult.eKycToken}</div>
              </div>
            </div>
          {/if}

          <div>
            <label for="reg-service" class="block text-[10px] text-[#555d6e] uppercase mb-1">Government Service to Link</label>
            <select
              id="reg-service"
              bind:value={regService}
              class="w-full p-2.5 bg-[#08090d] hairline-border text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="National Digital Identity Grid (DigiLocker)">National Digital Identity Grid (DigiLocker)</option>
              <option value="Direct Benefit Transfer (DBT)">Direct Benefit Transfer (DBT)</option>
              <option value="Income Tax Department (e-Filing)">Income Tax Department (e-Filing)</option>
              <option value="Ayushman Bharat Digital Mission (ABDM)">Ayushman Bharat Digital Mission (ABDM)</option>
            </select>
          </div>

          <div>
            <label for="reg-device" class="block text-[10px] text-[#555d6e] uppercase mb-1">Primary Authenticator Hardware</label>
            <select
              id="reg-device"
              bind:value={regDeviceModel}
              onchange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                if (val.includes('Touch ID') || val.includes('Titan')) regTransport = 'internal';
                else if (val.includes('YubiKey')) regTransport = 'usb';
                else regTransport = 'nfc';
              }}
              class="w-full p-2.5 bg-[#08090d] hairline-border text-white text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="Apple Silicon Secure Enclave (Touch ID)">Apple Silicon Secure Enclave (Touch ID)</option>
              <option value="Google Titan M2 Security Chip (Pixel 8)">Google Titan M2 Security Chip (Pixel 8)</option>
              <option value="Yubico YubiKey 5C NFC (FIDO2 Hardware Token)">Yubico YubiKey 5C NFC (FIDO2 Hardware Token)</option>
              <option value="Contactless FIDO2 Smart Card (NFC)">Contactless FIDO2 Smart Card (NFC)</option>
            </select>
          </div>
        </div>

        <!-- Anti-Impersonation & DPDP Security Dossier -->
        <div class="p-3 bg-[#08090d] hairline-border text-[10px] font-mono text-[#8e98aa] space-y-1.5">
          <div class="text-[#00ff99] font-bold flex items-center justify-between">
            <span>HOW WE PREVENT IMPOSTER BIOMETRICS:</span>
            <span class="text-[#5b6375] text-[9px]">FIDO2 LEVEL 3 / NIST AAL3</span>
          </div>
          <p class="leading-relaxed">
            1. <strong>UIDAI Demographic Binding:</strong> Before enrolling, the Relying Party validates that the name strictly matches official government records for that Aadhaar.<br/>
            2. <strong>Imposter Prevention:</strong> An attacker cannot bind their own fingerprint to your Aadhaar because passkey creation requires an official Aadhaar e-KYC proof token.<br/>
            3. <strong>Hardware Isolation:</strong> Once bound, the asymmetric private key is sealed inside your device hardware chip. No password is stored, and your fingerprint never leaves your device.
          </p>
        </div>

        <!-- Primary Action: Register -->
        <div>
          <button
            onclick={handleCreateAccount}
            disabled={store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE'}
            class="w-full py-4 px-6 bg-[#00d68f] hover:bg-[#00bd7e] active:bg-[#00a86f] text-black font-sans font-bold text-base tracking-wide uppercase transition-all duration-100 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {#if store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA'}
              <span class="w-4 h-4 border-2 border-black/30 border-t-black animate-spin"></span>
              <span class="font-mono text-sm tracking-wider">CREATING HARDWARE PASSKEY...</span>
            {:else}
              <span class="font-sans text-[15px] font-extrabold tracking-wider">REGISTER PASSKEY & CREATE ACCOUNT</span>
            {/if}
          </button>
        </div>

        <!-- Return to Login Link -->
        <div class="pt-3 hairline-t flex items-center justify-between text-[11px] font-mono text-[#5b6375]">
          <span>Already have an account?</span>
          <button 
            onclick={() => activeMode = 'LOGIN'}
            class="text-[#0052ff] hover:underline font-semibold cursor-pointer"
          >
            ← BACK TO LOG IN
          </button>
        </div>

      </div>
    {/if}

  </div>

  <!-- Interactive Biometric Sensor HUD Modal -->
  <BiometricSensorModal />
</div>
