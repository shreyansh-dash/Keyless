<script lang="ts">
  import { store } from '../store.svelte';
  import TelemetryStream from './TelemetryStream.svelte';

  let selectedDeviceId = $state(store.devices[0].id);
  let activeDevice = $derived(store.devices.find(d => d.id === selectedDeviceId) || store.devices[0]);

  function handleAuthClick() {
    store.triggerAuthentication();
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-84px)] bg-[#08090c]">
  <!-- Left Side: Live Security Log (Behind the scenes) -->
  <section class="lg:col-span-7 hairline-r flex flex-col p-4 bg-[#08090c] architectural-grid" aria-label="Security Log">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <h2 class="text-[12px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>LIVE SECURITY LOG</span>
          <span class="text-[10px] text-[#4f5667] font-normal">// WHAT HAPPENS BEHIND THE SCENES</span>
        </h2>
        <p class="text-[11px] text-[#6d7586] font-mono mt-0.5">
          See every step in real time as your fingerprint or device securely verifies you without any passwords.
        </p>
      </div>

      <!-- Security badge -->
      <div class="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#0d0f15] hairline-border font-mono text-[10px]">
        <span class="text-[#6c7485]">SAFETY:</span>
        <span class="text-[#00ff99] font-semibold">PHISHING PROOF</span>
      </div>
    </div>

    <!-- Telemetry Component Embed -->
    <div class="flex-1 min-h-[460px]">
      <TelemetryStream />
    </div>

    <!-- Quick info sub-strip -->
    <div class="mt-3 p-2.5 bg-[#0a0c10] hairline-border grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] text-[#717a8c]">
      <div>
        <div class="text-[#474e5e]">SECURITY METHOD</div>
        <div class="text-[#e2e5ec] font-medium">Public Key (Passkey)</div>
      </div>
      <div>
        <div class="text-[#474e5e]">HARDWARE CHIP</div>
        <div class="text-[#e2e5ec] font-medium">Built-in Secure Enclave</div>
      </div>
      <div>
        <div class="text-[#474e5e]">VERIFIED WEBSITE</div>
        <div class="text-[#e2e5ec] font-medium">id.digilocker.gov.in</div>
      </div>
      <div>
        <div class="text-[#474e5e]">VERIFICATION</div>
        <div class="text-[#00ff99] font-medium">Fingerprint / Face / PIN</div>
      </div>
    </div>
  </section>

  <!-- Right Side / Center: Main Login Card -->
  <section class="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 bg-[#090a0d]" aria-label="Login Card">
    
    <!-- MAIN CARD: Pure Flat Background, Swiss Architectural Weight -->
    <div class="w-full max-w-md bg-[#0e1016] hairline-border p-7 sm:p-8 flex flex-col relative shadow-2xl">
      
      <!-- Top Card Header Strip -->
      <div class="flex items-center justify-between text-[11px] font-mono text-[#5f6779] hairline-b pb-3 mb-6">
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 bg-[#0052ff]"></span>
          <span>LOGIN SCREEN</span>
        </span>
        <span class="text-[#00ff99]">BANK-GRADE SECURITY</span>
      </div>

      <!-- Identity Subject Context -->
      <div class="mb-5 font-mono text-[11px] bg-[#08090d] p-3 hairline-border text-[#8e97a8] flex items-center justify-between">
        <div>
          <span class="text-[#555d6e]">YOUR ID: </span>
          <span class="text-[#e2e5ec] font-medium">{store.user.nationalId}</span>
        </div>
        <div class="text-[10px] text-[#00ff99] bg-[#00ff99]/10 px-1.5 py-0.5">
          RISK LEVEL: LOW
        </div>
      </div>

      <!-- Bold Clean Sans-Serif Header -->
      <header class="mb-6">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-[#f4f6fb] tracking-tight font-sans uppercase">
          Verify your identity
        </h1>
        <p class="text-sm font-sans text-[#788194] mt-1.5 font-normal">
          Touch your phone fingerprint sensor, use Face ID, or tap your security key to log in.
        </p>
      </header>

      <!-- Active Hardware Authenticator Selector -->
      <div class="mb-6 space-y-2">
        <div class="text-[11px] font-mono text-[#6c7485] uppercase tracking-wider">
          Choose How You Want To Log In
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
                  <div class="text-[10px] font-mono text-[#5c6475]">Safe Hardware Key • Used {device.counter} times</div>
                </div>
              </div>
              <span class="text-[9px] font-mono px-1.5 py-0.5 bg-[#050608] hairline-border text-[#00ff99]">
                READY
              </span>
            </button>
          {/each}
        </div>
      </div>

      <!-- PRIMARY ACTION: Large Solid Color Button -->
      <div class="mb-6">
        <button
          onclick={handleAuthClick}
          disabled={store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE'}
          class="w-full py-4 px-6 bg-[#0052ff] hover:bg-[#0047e0] active:bg-[#003bc4] text-white font-sans font-bold text-base tracking-wide uppercase transition-all duration-100 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
        >
          {#if store.authStage === 'CHALLENGE_ISSUED' || store.authStage === 'PROMPTING_AUTHENTICATOR' || store.authStage === 'COLLECTING_CLIENT_DATA' || store.authStage === 'VERIFYING_FLAGS' || store.authStage === 'VERIFYING_SIGNATURE'}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white animate-spin"></span>
            <span class="font-mono text-sm tracking-wider">WAITING FOR YOUR TOUCH OR FACE...</span>
          {:else if store.authSuccess}
            <span class="text-white text-lg">✓</span>
            <span class="font-mono text-sm tracking-wider">LOGGED IN SUCCESSFULLY</span>
          {:else}
            <!-- Passkey / Key SVG Icon -->
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="square" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z"/>
            </svg>
            <span class="font-sans text-[15px] font-extrabold tracking-wider">LOG IN WITH FINGERPRINT / FACE ID</span>
          {/if}
        </button>
      </div>

      <!-- Verification Result Banner if Authenticated -->
      {#if store.authSuccess}
        <div class="mb-5 p-3 bg-[#003822] hairline-border border-[#00663e] text-[#00ff99] font-mono text-[11px] flex items-center justify-between animate-fadeIn">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-[#00ff99]"></span>
            <span>IDENTITY VERIFIED ({store.lastLatencyMs}ms)</span>
          </div>
          <span class="text-[9px] bg-[#004d2e] px-1.5 py-0.5 text-white">ACCESS GRANTED</span>
        </div>
      {/if}

      <!-- Clean Display of Active Device Key Code -->
      <footer class="p-3.5 bg-[#090b10] hairline-border space-y-2 font-mono text-[11px] text-[#717a8c]">
        <div class="text-[10px] text-[#4d5464] uppercase tracking-wider flex items-center justify-between">
          <span>Your Device's Unique Security Code</span>
          <span class="text-[#00ff99]">ENCRYPTED</span>
        </div>

        <!-- Truncated Hash Stream -->
        <div class="bg-[#050608] p-2 hairline-border text-[11px] text-[#e2e6f0] break-all select-all font-mono">
          {activeDevice.publicKeyHex}
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 text-[10px] text-[#606879]">
          <div>
            <span class="text-[#474e5e]">DEVICE ID: </span>
            <span class="text-[#abb3c4]">{activeDevice.aaguid.substring(0, 18)}...</span>
          </div>
          <div>
            <span class="text-[#474e5e]">CONNECTION: </span>
            <span class="text-[#abb3c4]">{activeDevice.transports.join(', ')}</span>
          </div>
        </div>
      </footer>

      <!-- Inclusivity Link -->
      <div class="mt-4 pt-3 hairline-t flex items-center justify-between text-[11px] font-mono text-[#5b6375]">
        <span>At a village cyber cafe or want voice login?</span>
        <button 
          onclick={() => store.activeTab = 'INCLUSIVITY'}
          class="text-[#0052ff] hover:underline font-semibold cursor-pointer"
        >
          TRY KIOSK / VOICE MODE →
        </button>
      </div>

    </div>
  </section>
</div>
