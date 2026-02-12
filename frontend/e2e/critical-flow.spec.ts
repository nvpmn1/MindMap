import { expect, test } from '@playwright/test';

const profileName = (process.env.E2E_PROFILE_NAME || 'Guilherme').toLowerCase();

function profileTestId(name: string): string {
  return `profile-${name.toLowerCase()}`;
}

test.describe('Critical browser flow', () => {
  test('login -> maps -> create map -> open editor', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId(profileTestId(profileName))).toBeVisible();
    await page.getByTestId(profileTestId(profileName)).click();

    await expect(page.getByTestId('login-submit')).toBeEnabled();
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/dashboard|maps/i, { timeout: 20_000 });

    await page.goto('/maps');
    await expect(page.getByTestId('maps-create-button')).toBeVisible();
    await page.getByTestId('maps-create-button').click();

    await page.waitForURL(/\/map\/[a-z0-9-]+/i, { timeout: 20_000 });
    await expect(page.getByTestId('map-editor-root')).toBeVisible();
  });
});
