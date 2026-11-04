// "Hide all panels" hotkey: toggles a body attribute that theme.css uses to
// hide every toolkit panel at once. Not saved: panels come back on restart.
import { onUnmounted, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { HIDE_ALL_TARGET } from '../shortcuts'

export const panelsHidden = shallowRef(false)

export function setPanelsHidden (hidden: boolean) {
  panelsHidden.value = hidden
  if (hidden) document.body.dataset.wokeHidden = ''
  else delete document.body.dataset.wokeHidden
}

export function useHideAllHotkey () {
  const sub = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
    if (e.target === HIDE_ALL_TARGET) setPanelsHidden(!panelsHidden.value)
  })
  onUnmounted(() => { sub.abort() })
}
