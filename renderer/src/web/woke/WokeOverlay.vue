<template>
  <SetupOverlay />
  <Dock />
  <ToolkitHealth />
  <AppNotices />
</template>

<script setup lang="ts">
import SetupOverlay from './switchboard/SetupOverlay.vue'
import Dock from './dock/Dock.vue'
import ToolkitHealth from './dock/ToolkitHealth.vue'
import AppNotices from './app/AppNotices.vue'
</script>
