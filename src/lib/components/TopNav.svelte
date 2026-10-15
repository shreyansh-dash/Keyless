<script lang="ts">
  import { store } from '../store.svelte';
  import type { ViewTab } from '../types';

  const navItems: { id: ViewTab; label: string; tag: string }[] = [
    { id: 'AUTH', label: 'LOGIN DEMO', tag: '01' },
    { id: 'PHISHING', label: 'PHISHING TEST', tag: '02' },
    { id: 'RECOVERY', label: 'ACCOUNT RECOVERY', tag: '03' },
    { id: 'INCLUSIVITY', label: 'VILLAGE KIOSK & VOICE', tag: '04' },
    { id: 'ADMIN', label: 'MANAGE DEVICES', tag: '05' },
    { id: 'THREAT_MODEL', label: 'SECURITY REPORT', tag: '06' },
  ];
</script>

<header class="w-full bg-[#0a0c10] hairline-b sticky top-0 z-50">
  <!-- Topmost Meta Strip -->
  <div class="px-4 py-1.5 bg-[#060709] hairline-b flex items-center justify-between text-[11px] font-mono tracking-tight text-[#808898]">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-none bg-[#00d68f]"></span>
        <span class="text-[#e2e5eb] font-semibold tracking-wider">PROJECT: CC6-IC04</span>
      </div>
      <span class="text-[#3b4252]">|</span>
      <span>NATIONAL DIGITAL IDENTITY (INDIA)</span>
      <span class="text-[#3b4252]">|</span>
      <span class="text-[#555d6e]">STANDARD: PASSKEY / FIDO2</span>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1.5">
        <span class="text-[#555d6e]">SECURITY LEVEL:</span>
        <span class="text-[#00d68f] bg-[#00d68f]/10 px-1.5 py-0.5 font-medium">BANK GRADE (AAL3)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[#555d6e]">OFFICIAL SITE:</span>
        <span class="text-[#99a1b3]">id.digilocker.gov.in</span>
      </div>
    </div>
  </div>

  <!-- Main Navigation Bar -->
  <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
    <!-- Brand / Architectural Title -->
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-[#0052ff] flex items-center justify-center text-white font-mono font-bold text-sm select-none">
        ✓
      </div>
      <div>
        <div class="text-[14px] font-bold tracking-tight text-white font-sans flex items-center gap-2">
          SECURE PASSKEY LOGIN
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-[#1b1e28] text-[#939baa] font-normal">NO PASSWORDS</span>
        </div>
        <div class="text-[11px] font-mono text-[#6c7485] leading-none mt-0.5">
          Fast, Safe, and Phishing-Proof Login for Everyone
        </div>
      </div>
    </div>

    <!-- Modular Nav Tabs -->
    <nav class="flex items-center gap-1 bg-[#07080b] p-1 hairline-border" aria-label="Main Navigation">
      {#each navItems as item}
        <button
          onclick={() => store.activeTab = item.id}
          class="px-3 py-1.5 text-[11px] font-mono tracking-wider transition-all duration-100 flex items-center gap-1.5 select-none cursor-pointer
            {store.activeTab === item.id
              ? 'bg-[#1e222d] text-white font-bold hairline-border shadow-sm'
              : 'text-[#858d9e] hover:text-[#e1e4ea] hover:bg-[#13151c]'}"
        >
          <span class="text-[9px] text-[#4e5566] font-semibold">{item.tag}.</span>
          <span>{item.label}</span>
        </button>
      {/each}
    </nav>
  </div>
</header>
