<template>
  <HiddenNote />
  <Dock />
  <ToolkitHealth />
  <OverlayLayer />
  <AppNotices />
</template>

<script setup lang="ts">
import HiddenNote from './switchboard/HiddenNote.vue'
import Dock from './dock/Dock.vue'
import ToolkitHealth from './dock/ToolkitHealth.vue'
import OverlayLayer from './ui/OverlayLayer.vue'
import AppNotices from './app/AppNotices.vue'
</script>
