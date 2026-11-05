<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <WSettingRow label="Lifeforce per item for Harvest rerolls"
      :hint="`What one item costs at the Horticrafting bench, in the craft's colour. Blank uses ${defaultCost}, from the wiki. Flips multiplies this by poe.ninja's lifeforce price.`">
      <!-- A plain input: WField's number mode turns a cleared field into 0. -->
      <input :value="cost" type="number" min="1" :placeholder="String(defaultCost)" class="rounded w-input px-1 block" style="width: 6rem;" @input="setCost">
    </WSettingRow>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { WSettingRow } from '../ui'
import { configProp } from '@/web/settings/utils'
import { DEFAULT_LIFEFORCE_PER_ITEM, parseLifeforce } from './families'
import type { ScarabFlipWidget } from './widget'

export default defineComponent({
  name: 'Flips',
  components: { WSettingRow },
  props: configProp<ScarabFlipWidget>(),
  setup (props) {
    return {
      defaultCost: DEFAULT_LIFEFORCE_PER_ITEM,
      cost: computed(() => props.configWidget.lifeforcePerItem ?? ''),
      setCost: (e: Event) => { props.configWidget.lifeforcePerItem = parseLifeforce((e.target as HTMLInputElement).value) }
    }
  }
})
</script>
