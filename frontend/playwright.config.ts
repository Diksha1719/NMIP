import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 180000,
  workers: 1,
  expect: { timeout: 20000 },
  use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000', channel: process.env.E2E_BROWSER || 'msedge', headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
});
