import { expect, test } from '@playwright/test';

for (const path of ['/', '/about', '/settings', '/reciter/itqan.dev-2']) {
  test(`the footer is visible at the bottom on desktop: ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto(path);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const box = await footer.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(box.y).toBeGreaterThanOrEqual(viewport.height - box.height - 1);
    }
  });
}
