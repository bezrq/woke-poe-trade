<template>
  <div class="p-2 flex flex-col gap-3" style="max-width: 44rem;">
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <div class="mb-1">All hotkeys</div>
        <div class="text-gray-500 text-sm">
          Every key APT and the toolkit listen for. Two actions on one key means only one of them works:
          change one where it's set (the Module column says where). Shows saved settings; press Save to see changes here.
        </div>
      </div>
      <span v-if="conflictCount" :class="$style.badge">{{ conflictCount }} clash{{ conflictCount > 1 ? 'es' : '' }}</span>
    </div>
    <div class="flex gap-2 items-center">
      <input v-model="search" type="search" placeholder="Find a key or action" class="rounded bg-gray-900 px-1 flex-1">
      <label class="flex items-center gap-1 text-sm"><input v-model="onlyClashes" type="checkbox"> Clashes only</label>
    </div>
    <table :class="$style.table">
      <tr :class="$style.head"><td>Action</td><td>Module</td><td>Key</td><td>Status</td></tr>
      <tr v-for="(r, i) in visible" :key="i" :class="{ [$style.clash]: isProblem(r), [$style.off]: r.off }">
        <td>{{ r.label }}</td>
        <td class="text-gray-500">{{ r.module }}</td>
        <td :class="$style.key">{{ r.key }}</td>
        <td>
          <span v-if="r.off && r.conflicts.length" class="text-yellow-400">Module off; would clash with {{ r.conflicts[0] }}</span>
          <span v-else-if="r.off" class="text-gray-500">Module off, key is free</span>
          <span v-else-if="r.conflicts.length" class="text-red-400">Same key as {{ r.conflicts.join(', ') }}</span>
          <span v-else-if="failedNorm.has(r.norm)" class="text-red-400">Another program holds this key; pick a different one</span>
          <span v-else class="text-gray-500">OK</span>
        </td>
      </tr>
      <tr v-if="!visible.length"><td colspan="4" class="text-gray-500">Nothing matches.</td></tr>
    </table>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Hotkey list'
}
</script>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useHotkeyHealth } from './hotkey-health'

const { rows, failedNorm } = useHotkeyHealth()
const isProblem = (r: { off: boolean, norm: string, conflicts: string[] }) => !r.off && (r.conflicts.length > 0 || failedNorm.value.has(r.norm))
const conflictCount = computed(() => new Set(rows.value.filter(isProblem).map(r => r.norm)).size)
const search = shallowRef('')
const onlyClashes = shallowRef(false)
const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter(r =>
    (!onlyClashes.value || r.conflicts.length || isProblem(r)) &&
    (!q || r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q) || r.module.toLowerCase().includes(q)))
})
</script>

<style module>
.table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.table td { padding: 3px 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.head td { color: rgb(160, 174, 192); }
.key { font-variant-numeric: tabular-nums; white-space: nowrap; }
.clash { background: rgba(245, 101, 101, 0.12); }
.off { opacity: 0.7; }
.off .key { text-decoration: line-through; }
.badge { font-size: 12px; font-weight: 600; color: #1a202c; background: rgb(236, 201, 75); border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
</style>
