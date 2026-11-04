<template>
  <w-segmented v-model="priceView" :options="OPTIONS" title="Classic is APT's plain listing table; Improved adds a verdict and fair price" />
</template>

<script setup lang="ts">
import { WSegmented } from '../ui'
import { priceView } from './view'

const OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'improved', label: 'Improved' }
]
</script>
