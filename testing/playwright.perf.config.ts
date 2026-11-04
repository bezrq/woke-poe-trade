// Performance checks (perf/): one worker, no retries, so runs are comparable.
// See perf/README.md.
import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testDir: 'perf',
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'perf-results/test-results',
  // A trace snapshots the DOM on every action, which would be measured too.
  use: { ...base.use, trace: 'off' }
})
