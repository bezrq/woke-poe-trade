<template>
  <div class="filter-name">
    <div class="filter-name-top">
      <button class="filter-name-label rounded border overflow-hidden text-ellipsis"
        :data-rarity="item.rarity"
        :class="{ 'border-gray-500': showAsActive, 'border-transparent': !showAsActive }"
        @click="toggleAccuracy">{{ label }}</button>
      <span class="ml-auto" />
      <slot name="meta" />
    </div>
    <div class="filter-name-sub">
      <span v-if="baseName">{{ baseName }}</span>
      <button v-if="filters.corrupted" @click="corrupted = !corrupted">
        <span v-if="corrupted" class="text-red-500">{{ t('item.corrupted') }}</span>
        <span v-else>{{ t('item.not_corrupted') }}</span>
      </button>
      <span class="ml-auto" />
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedItem } from '@/parser'
import type { ItemFilters } from './interfaces'
import { CATEGORY_TO_TRADE_ID } from '../trade/pathofexile-trade'

export default defineComponent({
  name: 'FilterName',
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    const label = computed(() => {
      const { filters } = props
      const activeSearch = (filters.searchRelaxed && !filters.searchRelaxed.disabled)
        ? filters.searchRelaxed
        : filters.searchExact

      if (activeSearch.name) {
        return activeSearch.name
      }
      if (activeSearch.baseType) {
        return activeSearch.baseType
      }
      if (activeSearch.category) {
        const tradeId = CATEGORY_TO_TRADE_ID.get(activeSearch.category)!
        return t('item_category.prop', [t(`item_category.${tradeId.replace('.', '_')}`)])
      }

      return '??? Report if you see this text'
    })

    const baseName = computed(() => {
      const { item } = props
      if (item.uniqueBase) return item.uniqueBase.name
      return (item.info.name !== label.value) ? item.info.name : ''
    })

    const showAsActive = computed(() => {
      const { filters } = props

      const activeSearch = (filters.searchRelaxed && !filters.searchRelaxed.disabled)
        ? filters.searchRelaxed
        : filters.searchExact
      if (activeSearch.sub && !activeSearch.sub.disabled) {
        return false
      }
      return filters.searchRelaxed?.disabled
    })

    function toggleAccuracy () {
      const { filters } = props
      if (filters.searchRelaxed) {
        filters.searchRelaxed.disabled = !filters.searchRelaxed.disabled
      }
    }

    const corrupted = computed<boolean>({
      get () { return props.filters.corrupted!.value },
      set (value) { props.filters.corrupted!.value = value }
    })

    return {
      t,
      label,
      baseName,
      showAsActive,
      toggleAccuracy,
      corrupted
    }
  }
})
</script>

<style lang="postcss">
.filter-name {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.filter-name-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}
.filter-name-sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  min-height: 20px;
  font-family: var(--w-body);
  font-size: 12px;
  color: var(--w-dim);
}
.filter-name-sub button:hover { color: var(--w-fg); }
.filter-name-label {
  font-size: 18px;
  line-height: 24px;
  padding: 0 4px;
  margin-left: -5px;
  white-space: nowrap;
}

/* woke: the item's name is the top of the window, in the game's rarity colours. */
:root:not([data-woke-theme="classic"]) .filter-name-label { color: var(--w-fg); }
:root:not([data-woke-theme="classic"]) .filter-name-label[data-rarity="Normal"] { color: var(--w-r-normal); }
:root:not([data-woke-theme="classic"]) .filter-name-label[data-rarity="Magic"] { color: var(--w-r-magic); }
:root:not([data-woke-theme="classic"]) .filter-name-label[data-rarity="Rare"] { color: var(--w-r-rare); }
:root:not([data-woke-theme="classic"]) .filter-name-label[data-rarity="Unique"] { color: #d98a4a; }
</style>
