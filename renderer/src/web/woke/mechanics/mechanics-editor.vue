<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <w-toggle v-model="autoSwitch">Switch tab when I enter a mechanic's zone (Azurite Mine, Sacred Grove, safehouses…)</w-toggle>
    <div>
      <div class="mb-1">Show these mechanics</div>
      <div class="grid gap-1" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
        <ui-checkbox v-for="m in MECHANICS" :key="m.id" :model-value="!configWidget.hidden.includes(m.id)" @update:model-value="setShown(m.id, $event)">
          {{ m.label }}
        </ui-checkbox>
      </div>
    </div>
    <div>
      <div class="mb-1">Betrayal rewards</div>
      <div class="w-dim text-sm mb-1">Rewards come from the 3.24 sheet. If a patch changes one, type the new reward here; leave empty to keep the default.</div>
      <div class="grid gap-1 items-center" style="grid-template-columns: 6rem repeat(4, minmax(0, 1fr));">
        <span />
        <span v-for="d in DIVISIONS" :key="d" class="w-dim text-sm">{{ d }}</span>
        <template v-for="m in MEMBERS" :key="m">
          <span class="w-dim">{{ m }}</span>
          <input v-for="(_, di) in DIVISIONS" :key="di"
            :value="configWidget.betrayalOverrides[slotKey(m, di)] ?? ''"
            :placeholder="REWARDS[m][di]"
            @input="setOverride(m, di, $event)"
            class="w-input rounded px-1 leading-6 text-sm min-w-0">
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import WToggle from '../ui/WToggle.vue'
import { defineComponent } from 'vue'
import UiCheckbox from '@/web/ui/UiCheckbox.vue'
import { configProp, configModelValue } from '@/web/settings/utils'
import { MECHANICS } from './data'
import { DIVISIONS, MEMBERS, REWARDS, slotKey } from './betrayal'
import type { MechanicsWidget } from './widget'

export default defineComponent({
  name: 'League mechanics',
  components: { WToggle, UiCheckbox },
  props: configProp<MechanicsWidget>(),
  setup (props) {
    return {
      MECHANICS,
      DIVISIONS,
      MEMBERS,
      REWARDS,
      slotKey,
      autoSwitch: configModelValue(() => props.configWidget, 'autoSwitch'),
      setShown (id: string, shown: boolean) {
        const hidden = props.configWidget.hidden.filter(h => h !== id)
        props.configWidget.hidden = shown ? hidden : [...hidden, id]
      },
      setOverride (member: string, di: number, e: Event) {
        const value = (e.target as HTMLInputElement).value.trim()
        const key = slotKey(member, di)
        const next = Object.fromEntries(Object.entries(props.configWidget.betrayalOverrides).filter(([k]) => k !== key))
        if (value) next[key] = value
        props.configWidget.betrayalOverrides = next
      }
    }
  }
})
</script>
