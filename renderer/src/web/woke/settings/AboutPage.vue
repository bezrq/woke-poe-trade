<template>
  <div :class="$style.page">
    <settings-about :config="config" />
    <w-setting-section title="Awakened PoE Trade supporters">
      <div :class="$style.thanks">
        <img src="/images/peepoLove2x.webp" alt="" :class="$style.peepo">
        <p class="w-dim">This toolkit is built on Awakened PoE Trade. These people keep it going on
          <a href="https://patreon.com/awakened_poe_trade" target="_blank" class="w-accent">Patreon</a>:</p>
      </div>
      <p :class="$style.names">{{ names }}</p>
    </w-setting-section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config } from '@/web/Config'
import { APP_PATRONS } from '@/assets/data'
import SettingsAbout from '@/web/settings/about.vue'
import { WSettingSection } from '../ui'

defineProps<{ config: Config }>()
const names = computed(() => [...APP_PATRONS]
  .sort((a, b) => b.style - a.style || b.months - a.months)
  .map(p => p.from).join(' · '))
</script>

<style module>
.page { display: flex; flex-direction: column; gap: var(--w-s5); }
.thanks { display: flex; gap: var(--w-s3); align-items: center; padding-top: var(--w-s2); font-size: var(--w-fs-sm); }
.peepo { width: 32px; height: 32px; flex: none; }
.names { font-size: var(--w-fs-sm); color: var(--w-fg); line-height: 1.6; padding-top: var(--w-s2); }
</style>
