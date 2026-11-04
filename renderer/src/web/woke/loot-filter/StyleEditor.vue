<template>
  <div :class="$style.editor">
    <div :class="$style.preview">
      <LabelPreview :text="previewText" :style-override="look" :visibility="visibility" :scale="1.3" />
    </div>
    <WSegmented :model-value="visibility" :options="visibilityOptions" @update:model-value="emit('visibility', $event as Visibility)" />

    <div :class="$style.grid">
      <span class="w-dim">Font size</span>
      <span class="flex items-center gap-2">
        <input type="range" min="18" max="45" :value="look.fontSize ?? DEFAULT_FONT" class="grow"
          @change="emit('patch', { fontSize: Number(($event.target as HTMLInputElement).value) })">
        <span class="w-num" style="width: 2ch;">{{ look.fontSize ?? DEFAULT_FONT }}</span>
      </span>

      <template v-for="c in colourRows" :key="c.key">
        <span class="w-dim">{{ c.label }}</span>
        <span class="flex items-center gap-2">
          <input type="color" :value="hex(c.value)" :class="$style.swatch" :aria-label="c.label"
            @change="setColour(c.key, ($event.target as HTMLInputElement).value)">
          <span class="w-num w-faint text-xs">{{ c.value ? c.value.slice(0, 3).join(' ') : 'none' }}</span>
          <button v-if="c.key === 'border' && c.value" class="w-icon-btn" title="No border" @click="emit('patch', { border: null })"><i class="fas fa-times" /></button>
        </span>
      </template>

      <span class="w-dim">Sound</span>
      <span class="flex items-center gap-2">
        <select :value="look.sound?.id ?? ''" :class="$style.select" aria-label="Alert sound"
          @change="setSound(($event.target as HTMLSelectElement).value, look.sound?.volume ?? 300)">
          <option value="">None</option>
          <option v-for="id in SOUND_IDS" :key="id" :value="id">{{ id }}</option>
        </select>
        <input v-if="look.sound" type="range" min="0" max="300" step="10" :value="look.sound.volume" class="grow" aria-label="Volume"
          @change="setSound(look.sound!.id, Number(($event.target as HTMLInputElement).value))">
      </span>

      <span class="w-dim">Beam</span>
      <span class="flex items-center gap-2">
        <select :value="look.effect?.color ?? ''" :class="$style.select" aria-label="Beam colour"
          @change="setEffect(($event.target as HTMLSelectElement).value, look.effect?.temp ?? false)">
          <option value="">None</option>
          <option v-for="c in POE_COLOURS" :key="c" :value="c">{{ c }}</option>
        </select>
        <label v-if="look.effect" class="flex items-center gap-1 text-xs w-dim">
          <input type="checkbox" :checked="look.effect.temp" @change="setEffect(look.effect!.color, ($event.target as HTMLInputElement).checked)"> only on drop
        </label>
      </span>

      <span class="w-dim">Map icon</span>
      <span class="flex items-center gap-1 flex-wrap">
        <select :value="look.icon ? String(look.icon.size) : ''" :class="$style.select" aria-label="Minimap icon size"
          @change="setIcon({ size: ($event.target as HTMLSelectElement).value })">
          <option value="">None</option>
          <option v-for="s in ICON_SIZES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <template v-if="look.icon">
          <select :value="look.icon.color" :class="$style.select" aria-label="Minimap icon colour" @change="setIcon({ color: ($event.target as HTMLSelectElement).value })">
            <option v-for="c in POE_COLOURS" :key="c" :value="c">{{ c }}</option>
          </select>
          <select :value="look.icon.shape" :class="$style.select" aria-label="Minimap icon shape" @change="setIcon({ shape: ($event.target as HTMLSelectElement).value })">
            <option v-for="s in ICON_SHAPES" :key="s" :value="s">{{ s }}</option>
          </select>
        </template>
      </span>
    </div>
    <div v-if="copyFrom.length" class="flex items-center gap-2 text-xs">
      <span class="w-dim">Copy look from</span>
      <select :class="$style.select" value="" aria-label="Copy style from tier" @change="copy(($event.target as HTMLSelectElement).value)">
        <option value="" disabled>tier…</option>
        <option v-for="t in copyFrom" :key="t.tier" :value="t.tier">{{ t.tier }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WSegmented } from '../ui'
import LabelPreview from './LabelPreview.vue'
import type { Visibility } from './parse'
import { DEFAULT_BG, DEFAULT_FONT, DEFAULT_TEXT } from './edits'
import type { Colour, StylePatch } from './edits'
import { ICON_SHAPES, ICON_SIZES, POE_COLOURS, SOUND_IDS } from './colours'

const props = withDefaults(defineProps<{
  look: StylePatch
  visibility: Visibility
  previewText: string
  // Other tiers whose look can be copied.
  copyFrom?: Array<{ tier: string, look: StylePatch }>
}>(), { copyFrom: () => [] })

const emit = defineEmits<{
  (e: 'patch', patch: StylePatch): void
  (e: 'visibility', v: Visibility): void
}>()

const visibilityOptions = [
  { value: 'Show', label: 'Show' },
  { value: 'Minimal', label: 'Minimal' },
  { value: 'Hide', label: 'Hide' }
]

const colourRows = computed(() => [
  { key: 'text' as const, label: 'Text', value: props.look.text ?? DEFAULT_TEXT },
  { key: 'border' as const, label: 'Border', value: props.look.border ?? null },
  { key: 'background' as const, label: 'Background', value: props.look.background ?? DEFAULT_BG }
])

function hex (c: Colour | null): string {
  if (!c) return '#000000'
  return '#' + c.slice(0, 3).map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')
}

function setColour (key: 'text' | 'border' | 'background', value: string) {
  const prev = props.look[key] ?? (key === 'background' ? DEFAULT_BG : DEFAULT_TEXT)
  const rgb = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16))
  emit('patch', { [key]: [rgb[0], rgb[1], rgb[2], prev?.[3] ?? 255] as Colour })
}

function setSound (id: string, volume: number) {
  emit('patch', { sound: id ? { id, volume } : null })
}

function setEffect (color: string, temp: boolean) {
  emit('patch', { effect: color ? { color, temp } : null })
}

function setIcon (change: { size?: string, color?: string, shape?: string }) {
  if (change.size === '') { emit('patch', { icon: null }); return }
  const cur = props.look.icon ?? { size: 1, color: 'White', shape: 'Circle' }
  emit('patch', {
    icon: {
      size: change.size != null ? Number(change.size) : cur.size,
      color: change.color ?? cur.color,
      shape: change.shape ?? cur.shape
    }
  })
}

function copy (tier: string) {
  const src = props.copyFrom.find(t => t.tier === tier)
  if (!src) return
  const s = src.look
  emit('patch', {
    fontSize: s.fontSize,
    text: s.text,
    border: s.border ?? null,
    background: s.background,
    sound: s.sound ?? null,
    effect: s.effect ?? null,
    icon: s.icon ?? null
  })
}
</script>

<style module>
.editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 56px;
  padding: 10px;
  background: #2b2a26;
  border-radius: var(--w-r-sm);
}
.grid {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 8px 10px;
  align-items: center;
  font-size: var(--w-text-sm);
}
.swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--w-line-strong);
  background: none;
  cursor: pointer;
}
.select {
  background: var(--w-panel-2);
  color: var(--w-fg);
  border: 1px solid var(--w-line);
  border-radius: var(--w-r-sm);
  padding: 2px 4px;
  font-size: var(--w-text-sm);
}
</style>
