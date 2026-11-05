<template>
  <div v-if="result" :class="$style.wrapper" class="w-pc-side">
    <div v-if="'error' in result" class="p-2">
      {{ result.error }}
    </div>
    <template v-if="'related' in result && result.related.length > 1">
      <div :class="$style.hd">Related to {{ item!.info.name }}</div>
      <div v-for="row in result.related" :key="row.name" v-item-tip="{ name: row.name }"
        :class="[$style.row, { [$style.me]: row.highlight }]">
        <img :class="$style.art" :src="row.icon" :alt="''">
        <span :class="$style.name">{{ row.name }}</span>
        <span :class="$style.price">
          <template v-if="row.price">{{ priceText(row.price) }}<img :class="$style.coin" :src="coin(row.price)" :alt="row.price.currency"></template>
          <span v-else :class="$style.none" title="poe.ninja has no price for this">?</span>
        </span>
      </div>
    </template>
    <template v-if="'items' in result && result.items.length">
      <div :class="$style.hd">Drops in {{ item!.info.name }}</div>
      <div v-for="row in result.items" :key="row.name" v-item-tip="{ name: row.name }" :class="$style.row">
        <img :class="$style.art" :src="row.icon" :alt="''">
        <span :class="$style.name">{{ row.name }}</span>
        <span :class="$style.price">
          <template v-if="row.price">{{ priceText(row.price) }}<img :class="$style.coin" :src="coin(row.price)" :alt="row.price.currency"></template>
          <span v-else :class="$style.none" title="poe.ninja has no price for this">?</span>
        </span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BaseType, ITEM_BY_REF, ITEM_DROP } from '@/assets/data'
import { usePoeninja, CurrencyValue, displayRounding } from '@/web/background/Prices'
import { getDetailsId } from '../trends/getDetailsId'
import { vItemTip } from '@/web/woke/ui/tooltip/item-tip'
import { ParsedItem } from '@/parser'

const { findPriceByQuery, autoCurrency, xchgRate } = usePoeninja()

function findItemByQueryId (queryId: string): BaseType | undefined {
  const [ns, encodedName] = queryId.split('::')
  const [name, variant] = encodedName.split(' // ')
  let found = ITEM_BY_REF(ns as unknown as BaseType['namespace'], name)
  if (found && ns === 'UNIQUE') {
    const filtered = found.filter(unique => unique.unique!.base === variant)
    if (filtered.length) found = filtered
  }
  // return any first item
  if (found && found.length) return found[0]
}

function findPriceByQueryId (queryId: string) {
  const [ns, encodedName] = queryId.split('::')
  const [name, variant] = encodedName.split(' // ')
  const priceEntry = findPriceByQuery({ ns, name, variant })
  if (priceEntry) {
    return autoCurrency(priceEntry.chaos)
  }
}

function getItemPrices (queryId: string) {
  const dropEntry = ITEM_DROP.find(entry => entry.query.includes(queryId))
  if (!dropEntry) return null

  const out = {
    related: [] as Array<{ name: string, icon: string, price?: CurrencyValue, highlight: boolean }>,
    items: [] as Array<{ name: string, icon: string, price?: CurrencyValue, chaos: number }>
  }
  for (const itemId of dropEntry.query) {
    const dbItem = findItemByQueryId(itemId)
    if (!dbItem) return { error: `Can't find "${itemId}".` }

    out.related.push({
      icon: dbItem.icon,
      name: dbItem.name,
      price: findPriceByQueryId(itemId),
      highlight: (itemId === queryId)
    })
  }
  for (const itemId of dropEntry.items) {
    const dbItem = findItemByQueryId(itemId)
    if (!dbItem) return { error: `Can't find "${itemId}".` }

    const price = findPriceByQueryId(itemId)
    out.items.push({
      icon: dbItem.icon,
      name: dbItem.name,
      price,
      chaos: !price ? -1 : (price.currency === 'div' ? price.max * (xchgRate.value ?? 1) : price.max)
    })
  }
  out.items.sort((a, b) => b.chaos - a.chaos)

  return out
}

export default defineComponent({
  directives: { itemTip: vItemTip },
  props: {
    item: {
      type: Object as PropType<ParsedItem | null>,
      default: null
    },
    clickPosition: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const result = computed(() => {
      if (!props.item) return

      const queryId = getDetailsId(props.item)
      if (!queryId) return

      return getItemPrices(`${queryId.ns}::${queryId.name}${queryId.variant ? ` // ${queryId.variant}` : ''}`)
    })

    return {
      result,
      priceText: (price: CurrencyValue) => (price.min === price.max)
        ? displayRounding(price.min, true)
        : `${displayRounding(price.min, true)}–${displayRounding(price.max, true)}`,
      coin: (price: CurrencyValue) => (price.currency === 'div') ? '/images/divine.png' : '/images/chaos.png'
    }
  }
})
</script>

<style lang="postcss" module>
.wrapper {
  width: 17.5rem;
  max-width: 100%;
  margin-top: 1.5rem;
  background: var(--w-panel-2);
  border: 1px solid var(--w-line);
  border-radius: var(--w-r-md);
  overflow: hidden;
  color: var(--w-fg);
  font-family: var(--w-body);
  font-size: var(--w-fs-md);
  box-shadow: var(--w-shadow);
}
.hd {
  padding: 6px 12px;
  background: var(--w-panel-solid);
  border-bottom: 1px solid var(--w-line);
  font-family: var(--w-head);
  font-size: var(--w-fs-lg);
  color: var(--w-accent);
}
.row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 2px 12px;
  border-bottom: 1px solid var(--w-line-soft);
}
.row:last-child { border-bottom: 0; }
.me { background: var(--w-accent-soft); }
.art { width: 28px; height: 28px; object-fit: contain; }
.name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #d98a4a; }
.price { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }
.coin { width: 16px; height: 16px; object-fit: contain; }
.none { color: var(--w-faint); font-weight: 400; }
</style>
