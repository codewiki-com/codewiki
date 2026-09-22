import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

for (const locale of ['en', 'zh']) {
  for (const { mobile, theme } of [false, true].flatMap((mobile) =>
    ['light', 'dark'].map((theme) => ({ mobile, theme })),
  )) {
    test(`${locale} ${mobile ? 'mobile' : 'desktop'} ${theme} keyboard search traps and restores focus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: mobile ? 390 : 1440, height: 844 });
      await page.addInitScript((theme) => {
        localStorage.setItem('cw:v1:prefs', JSON.stringify({ theme }));
      }, theme);
      await page.goto(locale === 'zh' ? '/zh/' : '/');
      await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();
      const opener = page.locator('header [data-palette-open]:visible');
      // Walk from the start with real Tab presses, including the desktop language dropdown.
      for (let i = 0; i < 20 && !(await opener.evaluate((el) => el === document.activeElement)); i++) {
        await page.keyboard.press('Tab');
      }
      await expect(opener).toBeFocused();
      await expect(opener).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      const input = dialog.getByRole('combobox');
      await expect(input).toBeFocused();
      await input.fill(locale === 'zh' ? '闭包' : 'closure');
      await expect(dialog.getByRole('option').first()).toBeVisible();
      await page.keyboard.press('Shift+Tab');
      await expect(dialog.getByRole('option').last()).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(input).toBeFocused();
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
        .analyze();
      expect(violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    });
  }

  test(`${locale} mobile navigation closes with Escape and when focus leaves`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(locale === 'zh' ? '/zh/' : '/');
    const menu = page.locator('.nav-menu');
    const trigger = menu.locator('summary');
    for (let i = 0; i < 10 && !(await trigger.evaluate((el) => el === document.activeElement)); i++)
      await page.keyboard.press('Tab');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(menu.locator('.menu-links a').first()).toBeFocused();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
      .analyze();
    expect(violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    for (let i = 0; i < 20 && (await menu.evaluate((el) => el.hasAttribute('open'))); i++)
      await page.keyboard.press('Tab');
    await expect(menu).not.toHaveAttribute('open');
    await expect(page.locator('main :focus')).toHaveCount(1);
  });
}
