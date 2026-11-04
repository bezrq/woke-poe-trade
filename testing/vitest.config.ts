// Node-side tests: OCR on screenshots (vision/) and main process handlers.
// The end-to-end overlay tests run with Playwright instead (e2e/).
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['vision/**/*.test.ts', 'main/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000
  }
})
