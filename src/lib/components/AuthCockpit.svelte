<script lang="ts">
  import { store } from '../store.svelte';

  let activeMode = $state<'LOGIN' | 'CREATE_ACCOUNT'>('LOGIN');

  // Login state
  let selectedDeviceId = $state(store.devices[0].id);
  let activeDevice = $derived(store.devices.find(d => d.id === selectedDeviceId) || store.devices[0]);
  let selectedUserId = $state(store.user.nationalId);

  // Registration state
  let regName = $state('');
  let regNationalId = $state('');
  let regService = $state('National Digital Identity Grid (DigiLocker)');
  let regDeviceModel = $state('Apple Silicon Secure Enclave (Touch ID)');
  let regTransport = $state<'internal' | 'usb' | 'nfc' | 'hybrid'>('internal');
  let regError = $state('');

  function handleAuthClick() {
    store.triggerAuthentication();
  }

  function handleAccountSelect(e: Event) {
    const target = e.target as HTMLSelectElement;
    selectedUserId = target.value;
    store.selectAccount(target.value);
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

  function prefillDemoCitizen(type: 'priya' | 'arjun') {
    if (type === 'priya') {
      regName = 'Priya Patel';
      regNationalId = 'IN-AADHAAR-5512-8801';
      regService = 'Direct Benefit Transfer (DBT)';
      regDeviceModel = 'Google Titan M2 Security Chip (Pixel 8)';
      regTransport = 'internal';
    } else {
      regName = 'Arjun Sundaram';
      regNationalId = 'IN-AADHAAR-7740-9921';
      regService = 'National Digital Identity Grid (DigiLocker)';
      regDeviceModel = 'Yubico YubiKey 5C NFC (FIDO2 Hardware Token)';
      regTransport = 'usb';
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

        <!-- Logout Action Button -->
        <button
          onclick={() => store.logout()}
          class="w-full py-3 bg-[#241216] hover:bg-[#38161d] active:bg-[#481c25] text-[#ff6174] font-mono text-xs font-bold uppercase tracking-wider hairline-border cursor-pointer transition-colors flex items-center justify-center gap-2"
        >
          <span>LOG OUT (TEST ANOTHER ACCOUNT / LOGIN AGAIN)</span>
        </button>

      </div>

    {:else if activeMode === 'LOGIN'}
      <!-- MODE 1: LOG IN TO EXISTING ACCOUNT -->
      <div class="space-y-6">
        
        <!-- Header -->
        <header>
          <h1 class="text-3xl font-extrabold text-[#f4f6fb] tracking-tight font-sans uppercase">
            Log in with Passkey
          </h1>
          <p class="text-sm font-sans text-[#788194] mt-1 font-normal">
            No passwords. No 6-digit SMS OTPs. Touch your fingerprint sensor, use Face ID, or tap your hardware key.
          </p>
        </header>

        <!-- Citizen Profile Selector -->
        <div class="space-y-1.5 font-mono text-xs">
          <label for="citizen-account-select" class="text-[10px] text-[#6c7485] uppercase tracking-wider block">
            Select Enrolled Citizen Profile
          </label>
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
        </div>

        <!-- Active Hardware Authenticator Selector -->
        <div class="space-y-2">
          <div class="text-[10px] font-mono text-[#6c7485] uppercase tracking-wider">
            Choose Your Authentication Device
          </div>
          <div class="space-y-2">
            {#each store.devices.filter(d => !d.revoked) as device}
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

        <!-- PRIMARY ACTION: Large Solid Blue Button -->
        <div>
          <button
            onclick={handleAuthClick}
            disabled={store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE'}
            class="w-full py-4 px-6 bg-[#0052ff] hover:bg-[#0047e0] active:bg-[#003bc4] text-white font-sans font-bold text-base tracking-wide uppercase transition-all duration-100 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
          >
            {#if store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE'}
              <span class="w-4 h-4 border-2 border-[#2b354d] border-t-white animate-spin"></span>
              <span class="font-mono text-sm tracking-wider">WAITING FOR YOUR TOUCH OR FACE...</span>
            {:else}
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="square" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z"/>
              </svg>
              <span class="font-sans text-[15px] font-extrabold tracking-wider">LOG IN WITH FINGERPRINT / FACE ID</span>
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
        <div class="flex items-center gap-2 font-mono text-[10px] text-[#6c7485]">
          <span>Quick Demo Fill:</span>
          <button
            onclick={() => prefillDemoCitizen('priya')}
            class="text-[#0052ff] hover:underline cursor-pointer"
          >
            [Priya Patel - DBT]
          </button>
          <span>•</span>
          <button
            onclick={() => prefillDemoCitizen('arjun')}
            class="text-[#0052ff] hover:underline cursor-pointer"
          >
            [Arjun Sundaram - DigiLocker]
          </button>
        </div>

        {#if regError}
          <div class="p-2.5 bg-[#381014] text-[#ff6174] font-mono text-[11px] hairline-border border-[#5e1e27]">
            {regError}
          </div>
        {/if}

        <!-- Registration Inputs Form -->
        <div class="space-y-3 font-mono text-xs">
          <div>
            <label for="reg-name" class="block text-[10px] text-[#555d6e] uppercase mb-1">Citizen Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Ramesh Kumar"
              bind:value={regName}
              class="w-full p-2.5 bg-[#08090d] hairline-border text-white text-xs font-mono focus:outline-none"
            />
          </div>

          <div>
            <label for="reg-id" class="block text-[10px] text-[#555d6e] uppercase mb-1">National ID / Aadhaar Number</label>
            <input
              id="reg-id"
              type="text"
              placeholder="e.g. IN-AADHAAR-9920-1123"
              bind:value={regNationalId}
              class="w-full p-2.5 bg-[#08090d] hairline-border text-white text-xs font-mono focus:outline-none"
            />
          </div>

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

        <!-- Privacy & DPDP Notice -->
        <div class="p-3 bg-[#08090d] hairline-border text-[10px] font-mono text-[#8e98aa] space-y-1">
          <div class="text-[#00ff99] font-bold">100% PRIVATE & PASSWORDLESS:</div>
          <p>
            Your device will seal your private key inside its hardware security chip. 
            No password is ever created, and your fingerprint or Face ID never leaves your device.
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
</div>
