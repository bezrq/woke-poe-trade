<template>
  <div :class="[$style.tile, { [$style.active]: !filter.disabled }]">
    <button type="button" :class="$style.label" @click="filter.disabled = !filter.disabled">{{ label }}</button>
    <div :class="$style.values">
    <input :class="$style.input" step="any" type="number"
      v-model.number="inputMin"
      @focus="inputFocus"
      @blur="inputMinBlur"
      @mousewheel.stop
      :style="{ width: `${1.2 + Math.max(String(inputMin).length, 2)}ch` }"
    >
    <template v-if="'max' in filter">
      <span>–</span>
      <input :class="$style.input" step="any" type="number"
        v-model.number="inputMax"
        @focus="inputFocus"
        @mousewheel.stop
        :style="{ width: `${1.2 + Math.max(String(inputMax).length, 2)}ch` }"
        placeholder="…"
      >
    </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from 'vue'
import { FilterNumeric } from './interfaces'

export default defineComponent({
  emits: [], // mutates filter
  props: {
    filter: {
      type: Object as PropType<FilterNumeric>,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const _inputMin = ref<number | ''>('')
    watch(() => props.filter, (filter) => {
      _inputMin.value = filter.value
    }, { immediate: true })

    const _inputMax = ref<number | ''>('')
    watch(() => props.filter, (filter) => {
      _inputMax.value = filter.max ?? ''
    }, { immediate: true })

    return {
      // Some of these strings are written for "Links: 6", and the value has its own line here.
      label: computed(() => props.name.replace(/[:：]\s*$/, '')),
      inputMin: computed<number | ''>({
        get () { return _inputMin.value },
        set (value) {
          _inputMin.value = value
          if (typeof value === 'number') {
            props.filter.value = value
          } else {
            props.filter.value = 0
          }
        }
      }),
      inputMax: computed<number | ''>({
        get () { return _inputMax.value },
        set (value) {
          _inputMax.value = value
          if (typeof value === 'number') {
            props.filter.max = value
          } else {
            props.filter.max = undefined
          }
        }
      }),
      inputFocus (e: FocusEvent) {
        const target = e.target as HTMLInputElement
        target.select()
        props.filter.disabled = false
      },
      inputMinBlur () {
        if (typeof _inputMin.value !== 'number') {
          _inputMin.value = 0
          props.filter.disabled = true
        }
      }
    }
  }
})
</script>

<style lang="postcss" module>
.tile {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: calc(46px * var(--w-text-scale, 1));
  min-height: calc(50px * var(--w-text-scale, 1));
  padding: 2px 6px;
  border: 1px solid var(--w-line-soft);
  border-radius: var(--w-radius-sm);
  color: var(--w-faint);

  &.active {
    background: var(--w-accent-soft);
    border-color: var(--w-line-strong);
    color: var(--w-dim);
  }
}

.label {
  font-size: calc(12px * var(--w-text-scale, 1));
  line-height: calc(16px * var(--w-text-scale, 1));
  white-space: nowrap;

  &:hover { color: var(--w-fg); }
}

.values {
  display: flex;
  align-items: center;
  font-size: calc(17px * var(--w-text-scale, 1));
  line-height: calc(24px * var(--w-text-scale, 1));
}

.active .values { color: var(--w-fg); }

.input {
  @apply text-center;
  @apply bg-transparent;
  @apply select-all;
  color: inherit;

  &:hover,
  &:focus {
    background: var(--w-panel-3);
  }

  &::placeholder {
    color: var(--w-faint);
  }

  &:focus { cursor: none; }
}
</style>
