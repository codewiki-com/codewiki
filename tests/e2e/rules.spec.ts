import { test, expect } from '@playwright/test';

test('rules pages show the install path for each supported tool', async ({ page }) => {
  for (const prefix of ['', '/zh']) {
    await page.goto(`${prefix}/rules/python/`);

    await expect(page.locator('[data-tool="Claude Code"]')).toHaveAttribute('data-install-path', 'CLAUDE.md');
    await expect(page.locator('[data-tool="Codex / agents"]')).toHaveAttribute(
      'data-install-path',
      'AGENTS.md',
    );
    await expect(page.locator('[data-tool="Cursor"]')).toHaveAttribute(
      'data-install-path',
      '.cursor/rules/codewiki-python.mdc',
    );
    await expect(page.locator('[data-tool="Cursor"] a')).toHaveAttribute(
      'href',
      '/rules/python/codewiki-python.mdc',
    );
  }
});
