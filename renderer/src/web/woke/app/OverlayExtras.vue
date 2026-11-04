<template>
  <setup-overlay />
  <app-notices />
</template>

<script setup lang="ts">
// Always mounted inside the overlay: the module setup card, update and crash notices.
import SetupOverlay from '../switchboard/SetupOverlay.vue'
import AppNotices from './AppNotices.vue'
</script>
