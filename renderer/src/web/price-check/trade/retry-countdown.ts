import { computed, onUnmounted, Ref, shallowRef, watch } from 'vue'

const RETRY_AFTER = /Retry after (\d+) seconds/

/** Counts down the wait named in a rate limit error, so Retry stays off until it ends. */
export function useRetryCountdown (error: Ref<string | null>) {
  const left = shallowRef(0)
  let timer: ReturnType<typeof setInterval> | undefined

  function stop () {
    clearInterval(timer)
    timer = undefined
  }

  watch(error, (text) => {
    stop()
    const match = RETRY_AFTER.exec(text ?? '')
    left.value = match ? Number(match[1]) : 0
    if (left.value <= 0) return
    // From a deadline, because a hidden window's timers run late.
    const deadline = Date.now() + left.value * 1000
    timer = setInterval(() => {
      left.value = Math.max(Math.ceil((deadline - Date.now()) / 1000), 0)
      if (left.value <= 0) stop()
    }, 1000)
  }, { immediate: true })

  onUnmounted(stop)

  return {
    retryIn: left,
    rateLimited: computed(() => RETRY_AFTER.test(error.value ?? ''))
  }
}
