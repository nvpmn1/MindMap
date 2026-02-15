import { expect, test } from '@playwright/test';

const profileName = (process.env.E2E_PROFILE_NAME || 'guilherme').toLowerCase();

function accountTestId(name: string): string {
  return `account-${name.toLowerCase()}`;
}

function passwordFor(name: string): string {
  const fromEnv = process.env.E2E_PASSWORD;
  if (fromEnv) return fromEnv;

  if (name === 'helen') return 'helen123';
  if (name === 'pablo') return 'pablo123';
  return 'gui1998';
}

test.describe('Critical browser flow', () => {
  test('login -> maps -> create map -> open editor', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId(accountTestId(profileName))).toBeVisible();
    await page.getByTestId(accountTestId(profileName)).click();

    await page.getByTestId('login-password').fill(passwordFor(profileName));
    await expect(page.getByTestId('login-submit')).toBeEnabled();
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/dashboard|maps/i, { timeout: 20_000 });

    await page.goto('/maps');
    const mapsCreateButton = page.getByTestId('maps-create-button');
    if (await mapsCreateButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await mapsCreateButton.click();
    } else {
      await page.goto('/dashboard');
      const dashboardCreateButton = page.getByRole('button', {
        name: /criar novo mapa mental|criar primeiro mapa/i,
      });
      await expect(dashboardCreateButton).toBeVisible();
      await dashboardCreateButton.click();
    }

    await page.waitForURL(/\/map\/[a-z0-9-]+/i, { timeout: 20_000 });
    await expect(page.getByTestId('map-editor-root')).toBeVisible();
  });
});
