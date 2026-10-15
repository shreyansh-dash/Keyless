<script lang="ts">
  import { store } from './lib/store.svelte';
  import TopNav from './lib/components/TopNav.svelte';
  import AuthCockpit from './lib/components/AuthCockpit.svelte';
  import PhishingLab from './lib/components/PhishingLab.svelte';
  import RecoveryEngine from './lib/components/RecoveryEngine.svelte';
  import InclusivityModule from './lib/components/InclusivityModule.svelte';
  import DeviceLedger from './lib/components/DeviceLedger.svelte';
  import ThreatModelDossier from './lib/components/ThreatModelDossier.svelte';
</script>

<div class="min-h-screen bg-[#08090c] text-[#e1e4ea] flex flex-col font-sans selection:bg-[#0052ff] selection:text-white">
  <!-- Top Navigation & System HUD -->
  <TopNav />

  <!-- Main Viewport Router -->
  <main class="flex-1 w-full max-w-[1700px] mx-auto overflow-x-hidden">
    {#if store.activeTab === 'AUTH'}
      <AuthCockpit />
    {:else if store.activeTab === 'PHISHING'}
      <PhishingLab />
    {:else if store.activeTab === 'RECOVERY'}
      <RecoveryEngine />
    {:else if store.activeTab === 'INCLUSIVITY'}
      <InclusivityModule />
    {:else if store.activeTab === 'ADMIN'}
      <DeviceLedger />
    {:else if store.activeTab === 'THREAT_MODEL'}
      <ThreatModelDossier />
    {/if}
  </main>

  <!-- Clean Footer -->
  <footer class="w-full bg-[#06070a] hairline-t py-3 px-6 text-[11px] font-mono text-[#5b6375] flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <span class="w-1.5 h-1.5 bg-[#00ff99]"></span>
      <span class="text-[#abb3c4] font-semibold">SECURE PASSKEY LOGIN</span>
      <span class="text-[#3b4252]">•</span>
      <span>NATIONAL DIGITAL IDENTITY (INDIA)</span>
      <span class="text-[#3b4252]">•</span>
      <span>PROBLEM: CC6-IC04</span>
    </div>

    <div class="flex items-center gap-4 text-[10px]">
      <span>100% PHISHING-PROOF</span>
      <span class="text-[#3b4252]">•</span>
      <span>WORKS ON ALL PHONES & KIOSKS</span>
      <span class="text-[#3b4252]">•</span>
      <span class="text-[#0052ff]">BANK-GRADE SECURITY</span>
    </div>
  </footer>
</div>
