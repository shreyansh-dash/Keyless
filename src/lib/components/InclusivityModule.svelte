<script lang="ts">
  import { store } from '../store.svelte';

  let activeInclusivityMode = $state<'KIOSK_QR' | 'VOICE_ASSIST'>('KIOSK_QR');
  let kioskQrScanned = $state(false);
  let kioskAuthSuccess = $state(false);
  let speechSpeaking = $state(false);

  function simulatePhoneScan() {
    kioskQrScanned = true;
    store.addLog('HYBRID_QR_SCANNED', 'CLIENT_DATA', `Public village kiosk paired with trusted phone.`, {
      kioskId: store.kioskSessionId,
      connectedVia: 'Bluetooth / QR Code Scan',
      operatorPhone: 'Village Level Entrepreneur (VLE) Certified Tablet',
    }, 'info');

    setTimeout(() => {
      kioskAuthSuccess = true;
      store.addLog('KIOSK_AUTH_CONFIRMED', 'OK', 'Citizen approved login on their phone. Public screen unlocked.', {
        passwordsTypedOnPublicPC: 'Zero (No keyboard needed)',
        safetyVerdict: '100% Keylogger-Proof',
      }, 'success');
    }, 1200);
  }

  function resetKioskDemo() {
    kioskQrScanned = false;
    kioskAuthSuccess = false;
  }

  function playVoicePrompt() {
    speechSpeaking = true;
    store.triggerAudioCue();
    setTimeout(() => {
      speechSpeaking = false;
    }, 4000);
  }
</script>

<div class="p-6 bg-[#08090c] min-h-[calc(100vh-84px)] space-y-6">
  <!-- Top Header Banner -->
  <div class="bg-[#0e1016] hairline-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-[11px] font-mono text-[#00ff99] mb-1">
        <span class="w-2 h-2 bg-[#00ff99]"></span>
        <span>REQUIREMENT 5: INCLUSIVITY & RURAL ACCESS</span>
      </div>
      <h1 class="text-2xl font-bold font-sans text-white tracking-tight uppercase">
        Village Kiosks & Voice-Guided Login
      </h1>
      <p class="text-sm font-sans text-[#788194] max-w-3xl mt-1">
        Designed for citizens with basic feature phones, no smartphones, or limited literacy. Easily log in at <strong>Common Service Centres (CSCs)</strong> or listen to a <strong>spoken voice confirmation</strong> in your native language.
      </p>
    </div>

    <!-- Mode Selector -->
    <div class="flex items-center gap-1 bg-[#06070a] p-1 hairline-border font-mono text-xs">
      <button
        onclick={() => activeInclusivityMode = 'KIOSK_QR'}
        class="px-4 py-2 transition-colors cursor-pointer {activeInclusivityMode === 'KIOSK_QR' ? 'bg-[#1b1f2b] text-white font-bold hairline-border' : 'text-[#727a8c] hover:text-white'}"
      >
        01. VILLAGE KIOSK QR CODE
      </button>
      <button
        onclick={() => activeInclusivityMode = 'VOICE_ASSIST'}
        class="px-4 py-2 transition-colors cursor-pointer {activeInclusivityMode === 'VOICE_ASSIST' ? 'bg-[#1b1f2b] text-white font-bold hairline-border' : 'text-[#727a8c] hover:text-white'}"
      >
        02. SPOKEN VOICE CODE
      </button>
    </div>
  </div>

  {#if activeInclusivityMode === 'KIOSK_QR'}
    <!-- MODE 1: CSC RURAL KIOSK HYBRID QR AUTHENTICATION -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Kiosk Terminal Display -->
      <div class="lg:col-span-7 bg-[#0c0e14] hairline-border p-6 flex flex-col justify-between space-y-6">
        <div>
          <div class="flex items-center justify-between hairline-b pb-3 mb-4">
            <div class="font-mono text-xs text-white font-bold uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 bg-[#0052ff]"></span>
              <span>VILLAGE CYBER CAFE / PUBLIC KIOSK SCREEN</span>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 bg-[#151922] text-[#8e97a8] hairline-border">
              SESSION: {store.kioskSessionId}
            </span>
          </div>

          <p class="font-sans text-sm text-[#8c96a8] mb-5">
            This represents a shared public village computer. You <strong>never type any passwords or PINs</strong> on this computer, so hidden spy software or keyloggers can never steal your account.
          </p>

          <!-- Simulated QR Code Box -->
          <div class="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#08090d] hairline-border">
            <div class="p-3 bg-white text-black flex flex-col items-center justify-center relative select-none">
              <!-- SVG High-Contrast QR Code -->
              <svg class="w-40 h-40" viewBox="0 0 120 120" fill="currentColor">
                <rect x="10" y="10" width="30" height="30" fill="black"/>
                <rect x="15" y="15" width="20" height="20" fill="white"/>
                <rect x="20" y="20" width="10" height="10" fill="black"/>
                
                <rect x="80" y="10" width="30" height="30" fill="black"/>
                <rect x="85" y="15" width="20" height="20" fill="white"/>
                <rect x="90" y="20" width="10" height="10" fill="black"/>
                
                <rect x="10" y="80" width="30" height="30" fill="black"/>
                <rect x="15" y="85" width="20" height="20" fill="white"/>
                <rect x="20" y="90" width="10" height="10" fill="black"/>

                <rect x="45" y="15" width="6" height="6" fill="black"/>
                <rect x="55" y="20" width="6" height="6" fill="black"/>
                <rect x="65" y="12" width="6" height="6" fill="black"/>
                <rect x="48" y="32" width="6" height="6" fill="black"/>
                <rect x="62" y="35" width="6" height="6" fill="black"/>
                <rect x="50" y="50" width="20" height="20" fill="black"/>
                <rect x="55" y="55" width="10" height="10" fill="white"/>
                <rect x="25" y="50" width="6" height="6" fill="black"/>
                <rect x="35" y="60" width="6" height="6" fill="black"/>
                <rect x="85" y="50" width="6" height="6" fill="black"/>
                <rect x="95" y="60" width="6" height="6" fill="black"/>
                <rect x="45" y="80" width="6" height="6" fill="black"/>
                <rect x="55" y="90" width="6" height="6" fill="black"/>
                <rect x="70" y="85" width="6" height="6" fill="black"/>
                <rect x="85" y="90" width="6" height="6" fill="black"/>
              </svg>
              <div class="text-[9px] font-mono font-bold text-black tracking-tight mt-1">
                SCAN TO LOG IN
              </div>
            </div>

            <div class="space-y-3 font-mono text-xs">
              <div class="text-[#00ff99] text-[11px] font-bold uppercase tracking-wider">
                Safe One-Time QR Code
              </div>
              <p class="text-[#8e98aa] text-[11px] leading-relaxed">
                Scan with any certified village operator phone, family member's phone, or your own companion device.
              </p>
              <div class="text-[10px] text-[#555d6e] space-y-1">
                <div>• Changes automatically every 45 seconds</div>
                <div>• Safe connection over Bluetooth / Encrypted tunnel</div>
                <div>• You approve it on your trusted phone</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Simulated Mobile Scanner Interaction Button -->
        <div class="pt-2">
          {#if !kioskQrScanned}
            <button
              onclick={simulatePhoneScan}
              class="w-full py-3 px-4 bg-[#0052ff] hover:bg-[#0042cc] text-white font-mono text-xs font-bold uppercase tracking-wider hairline-border cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📱 SCAN QR CODE WITH OPERATOR / COMPANION PHONE</span>
            </button>
          {:else if !kioskAuthSuccess}
            <div class="p-3 bg-[#131720] hairline-border text-[#56bbf5] font-mono text-xs flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 border-2 border-[#1b2b3a] border-t-[#56bbf5] animate-spin"></span>
                <span>PROMPT POPPED UP ON PHONE...</span>
              </div>
              <span class="text-[10px] text-[#8e98aa]">Touch fingerprint on phone now</span>
            </div>
          {:else}
            <div class="p-4 bg-[#003822] hairline-border border-[#00663e] flex items-center justify-between">
              <div class="font-mono text-xs text-[#00ff99]">
                <div class="font-bold uppercase tracking-wider">✓ LOGIN APPROVED!</div>
                <div class="text-[11px] text-[#7ce38b]">Citizen is safely logged in. Zero passwords were left on this public computer.</div>
              </div>
              <button
                onclick={resetKioskDemo}
                class="px-3 py-1 bg-[#004d2e] hover:bg-[#00663e] text-white font-mono text-xs hairline-border cursor-pointer"
              >
                RESET DEMO
              </button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Right Column: Safety Explanation -->
      <div class="lg:col-span-5 bg-[#0c0e14] hairline-border p-6 space-y-4 font-mono text-xs">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider hairline-b pb-2">
          Why This Helps Rural Citizens
        </h3>

        <div class="text-[#8a94a6] space-y-3 text-[11px] leading-relaxed">
          <p>
            Millions of citizens in India visit village cyber cafes (CSCs) to check land records (Bhulekh), apply for pensions, or access ration services.
          </p>
          <div class="p-3 bg-[#08090d] hairline-border space-y-1">
            <span class="text-white font-bold">The Danger:</span>
            <p class="text-[#ff99a6]">
              Public keyboards can have spy devices (keyloggers) recording every password and OTP you type.
            </p>
          </div>
          <div class="p-3 bg-[#08090d] hairline-border space-y-1">
            <span class="text-[#00ff99] font-bold">The Solution:</span>
            <p class="text-[#7ce38b]">
              The public computer is only used as a screen to show a QR code. Your secret credentials never leave your trusted phone or key fob.
            </p>
          </div>
        </div>
      </div>

    </div>
  {:else}
    <!-- MODE 2: SPOKEN VOICE CODE -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Audio Trigger Card -->
      <div class="lg:col-span-7 bg-[#0c0e14] hairline-border p-6 space-y-6">
        <div class="flex items-center justify-between hairline-b pb-3">
          <div class="font-mono text-xs text-white font-bold uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 bg-[#00d68f]"></span>
            <span>SPOKEN VOICE CODE (FOR BASIC PHONES & SENIORS)</span>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 bg-[#171b24] text-[#8e98aa] hairline-border">
            VOICE ASSISTANT
          </span>
        </div>

        <p class="font-sans text-sm text-[#8c96a8]">
          Seniors or citizens who cannot read English can listen to a spoken voice prompt in their own language before confirming their login.
        </p>

        <!-- Audio Player Control Card -->
        <div class="p-5 bg-[#08090d] hairline-border space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-[10px] font-mono text-[#555d6e] uppercase">Choose Language</div>
              <div class="flex gap-2 mt-1">
                <button
                  onclick={() => store.audioLang = 'en-IN'}
                  class="px-3 py-1 text-xs font-mono hairline-border cursor-pointer {store.audioLang === 'en-IN' ? 'bg-[#0052ff] text-white font-bold' : 'bg-[#12141c] text-[#8e97a8]'}"
                >
                  English (India)
                </button>
                <button
                  onclick={() => store.audioLang = 'hi-IN'}
                  class="px-3 py-1 text-xs font-mono hairline-border cursor-pointer {store.audioLang === 'hi-IN' ? 'bg-[#0052ff] text-white font-bold' : 'bg-[#12141c] text-[#8e97a8]'}"
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            <div>
              <div class="text-[10px] font-mono text-[#555d6e] uppercase">Spoken Numbers</div>
              <div class="font-mono text-xl font-extrabold text-[#00ff99] tracking-widest mt-0.5">
                {store.audioCode.split('').join(' - ')}
              </div>
            </div>
          </div>

          <!-- Play Speech Action Button -->
          <button
            onclick={playVoicePrompt}
            disabled={speechSpeaking}
            class="w-full py-4 bg-[#141722] hover:bg-[#1a1f2e] text-white font-mono text-xs font-bold uppercase tracking-wider hairline-border flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            {#if speechSpeaking}
              <span class="w-3 h-3 bg-[#00ff99] animate-ping"></span>
              <span class="text-[#00ff99]">SPEAKING CODE OUT LOUD...</span>
            {:else}
              <span class="text-base">🔊</span>
              <span>PLAY SPOKEN CODE OUT LOUD (VOICE)</span>
            {/if}
          </button>
        </div>

        <!-- Tactile Token Instructions -->
        <div class="p-4 bg-[#090b10] hairline-border font-mono text-xs space-y-2">
          <div class="text-white font-bold text-[11px] uppercase tracking-wider">
            Simple 3-Step Process:
          </div>
          <ol class="list-decimal pl-4 space-y-1 text-[#8f99ab] text-[11px]">
            <li>Listen as the voice clearly recites the 3 numbers in your chosen language.</li>
            <li>Look at your key card or screen to confirm the numbers match.</li>
            <li>Touch your finger on the sensor to finish logging in safely.</li>
          </ol>
        </div>
      </div>

      <!-- Right Column: Simple phone info -->
      <div class="lg:col-span-5 bg-[#0c0e14] hairline-border p-6 space-y-4 font-mono text-xs">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider hairline-b pb-2">
          Works Even With Basic Phones (No Smartphone)
        </h3>
        <p class="text-[#848e9f] text-[11px] leading-relaxed">
          Citizens who only have a basic feature phone (like a 2G phone or JioPhone) can carry a small ₹150 contactless key card or key fob.
        </p>

        <div class="p-3 bg-[#06070a] hairline-border space-y-2 text-[10px] text-[#717a8c]">
          <div class="text-white font-bold">ACCESSIBILITY:</div>
          <div>• No reading or writing required.</div>
          <div>• Speaks in Hindi or English (more languages ready).</div>
          <div>• Designed for elderly and visually impaired users.</div>
        </div>
      </div>

    </div>
  {/if}
</div>
