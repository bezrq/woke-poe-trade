<template>
  <span :class="$style.dust" :title="`${t('item.disenchanting')}: ${amount.toLocaleString()} Kalguuran dust`">
    <img src="/images/dust.png" :class="$style.icon" />{{ amount.toLocaleString() }}
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ amount: number }>()
const { t } = useI18n()
</script>

<style module>
.dust {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 0.5rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--w-dim, #9ca3af);
}
.icon {
  width: 1.25rem;
  margin-block: -0.25rem;
}
</style>
