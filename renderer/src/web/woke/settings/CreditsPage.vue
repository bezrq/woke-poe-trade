<template>
  <div :class="$style.page">
    <w-setting-section v-for="g in CREDIT_GROUPS" :key="g.id" :title="g.title">
      <div v-for="c in g.credits" :key="c.name" :class="$style.row" :data-setting="c.name">
        <div :class="$style.text">
          <a :href="c.url" target="_blank" class="w-accent hover:underline">{{ c.name }}</a>
          <div class="w-dim" :class="$style.use">{{ c.use }}</div>
        </div>
        <span v-if="c.license" :class="$style.license">{{ c.license }}</span>
      </div>
    </w-setting-section>
    <p class="w-dim" :class="$style.note">
      Woke PoE Trade is an unofficial fan project, not affiliated with or endorsed by Grinding Gear Games.
      Smaller packages are listed in the project's package.json files.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Config } from '@/web/Config'
import { WSettingSection } from '../ui'
import { CREDIT_GROUPS } from './credits'

defineProps<{ config: Config }>()
</script>

<style module>
.page { display: flex; flex-direction: column; gap: var(--w-s5); }
.row { display: flex; align-items: center; gap: var(--w-s3); padding: var(--w-s2) 0; border-bottom: 1px solid var(--w-line); }
.text { flex: 1; min-width: 0; }
.use { font-size: var(--w-fs-sm); line-height: 1.4; padding-top: 2px; }
.license {
  flex: none; font-size: var(--w-fs-xs); line-height: 18px; padding: 0 var(--w-s2); color: var(--w-dim);
  border: 1px solid var(--w-line); border-radius: var(--w-r-pill);
}
.note { font-size: var(--w-fs-sm); line-height: 1.5; }
</style>
