<template>
  <div class="max-w-xl p-2 flex flex-col gap-3">
    <WSettingRow label="Lifeforce per item for Harvest rerolls"
      :hint="`What one item costs at the Horticrafting bench, in the craft's colour. Blank uses ${defaultCost}, from the wiki. Flips multiplies this by poe.ninja's lifeforce price.`">
      <WField :model-value="cost" type="number" :placeholder="String(defaultCost)" style="width: 6rem;" @update:model-value="setCost" />
    </WSettingRow>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { WField, WSettingRow } from '../ui'
import { configProp } from '@/web/settings/utils'
import { DEFAULT_LIFEFORCE_PER_ITEM, parseLifeforce } from './families'
import type { ScarabFlipWidget } from './widget'

export default defineComponent({
  name: 'Flips',
  components: { WField, WSettingRow },
  props: configProp<ScarabFlipWidget>(),
  setup (props) {
    return {
      defaultCost: DEFAULT_LIFEFORCE_PER_ITEM,
      cost: computed(() => props.configWidget.lifeforcePerItem ?? ''),
      setCost: (value: string | number) => { props.configWidget.lifeforcePerItem = parseLifeforce(value) }
    }
  }
})
</script>
