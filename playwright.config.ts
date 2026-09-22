import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // Electron apps are heavy: give each test plenty of time to start up.
  timeout: 90_000,
  expect: {
    timeout: 20_000
  },
  // Share one Electron instance per test suite; never parallelise Electron.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']]
})
