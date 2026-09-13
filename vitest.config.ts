import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only unit tests live here; the Electron E2E suite is run by Playwright.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node'
  }
})
