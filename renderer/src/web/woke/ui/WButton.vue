<template>
  <component :is="href ? 'a' : 'button'" :type="href ? undefined : 'button'" :href="href" :target="href ? '_blank' : undefined"
    :class="[$style.btn, $style[variant], { [$style.sm]: size === 'sm' }]">
    <i v-if="icon" :class="icon" />
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
  icon?: string
  href?: string
}>(), { variant: 'default', size: 'md', icon: undefined, href: undefined })
</script>

<style module>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: calc(12px * var(--w-text-scale, 1));
  font-weight: 500;
  line-height: calc(18px * var(--w-text-scale, 1));
  padding: 3px 10px;
  border: 1px solid var(--w-line-strong);
  border-radius: var(--w-radius-sm);
  background: var(--w-panel-2);
  color: var(--w-fg);
  white-space: nowrap;
}
.btn:hover { background: var(--w-panel-3); }
.btn:disabled { opacity: 0.5; pointer-events: none; }
.sm { padding: 1px 7px; font-size: calc(11.5px * var(--w-text-scale, 1)); }
.default {}
.primary { background: var(--w-accent); border-color: var(--w-accent); color: var(--w-accent-fg); }
.primary:hover { background: var(--w-accent); filter: brightness(1.1); }
.ghost { background: none; border-color: transparent; color: var(--w-dim); }
.ghost:hover { color: var(--w-fg); }
.danger { color: var(--w-down); border-color: color-mix(in srgb, var(--w-down) 40%, transparent); }
</style>
