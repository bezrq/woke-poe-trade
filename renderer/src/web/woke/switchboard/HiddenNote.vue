<template>
  <div v-if="panelsHidden" :class="$style.hiddenNote">
    Toolkit panels hidden<template v-if="hideKey">, press <w-kbd :keys="hideKey" /> to show</template>
    <button type="button" class="w-icon-btn" title="Show panels" @click="setPanelsHidden(false)"><i class="fas fa-eye" /></button>
  </div>
</template>

<script setup lang="ts">
// Picking tools happens in the setup window (first launch, the tray menu,
// or Settings → Modules → Run setup again); this only owns the hide-all key.
import { computed } from 'vue'
import { AppConfig } from '@/web/Config'
import { WKbd } from '../ui'
import { panelsHidden, setPanelsHidden, useHideAllHotkey } from '../shared/hide-all'

// This component is always mounted, so it also owns the hide-all hotkey.
useHideAllHotkey()
const hideKey = computed(() => AppConfig().woke?.hideAllHotkey ?? null)
</script>

<style module>
.hiddenNote {
  position: absolute;
  left: 50%;
  top: 6px;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  font-family: var(--w-body);
  font-size: var(--w-fs-xs);
  color: var(--w-dim);
  background: var(--w-panel);
  border: 1px solid var(--w-line);
  border-radius: var(--w-r-pill);
  opacity: 0.85;
}
</style>
