import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4321);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  webServer: {
    command: `pnpm preview --port ${port}`,
    port,
    reuseExistingServer: false,
    // Astro daemonises `preview` when it detects a coding-agent environment, which makes the
    // command exit before Playwright can use it. This opt-out keeps it in the foreground; the
    // older agent markers stay blank for Astro versions that inspect them directly.
    env: { ASTRO_PREVIEW_BACKGROUND: '0', CLAUDECODE: '', AI_AGENT: '' },
  },
  // The bundled headless shell crashed between contexts; full Chromium passed the same suite.
  projects: [{ name: 'chromium', use: { browserName: 'chromium', channel: 'chromium' } }],
});
