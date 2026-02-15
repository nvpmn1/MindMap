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

test.describe('AI agent recreate map flow', () => {
  test('sends "recrie esse mapa" and does not hit tool_use/tool_result protocol error', async ({
    page,
  }) => {
    const apiFailures: Array<{ url: string; status: number; body: string }> = [];
    const persistenceFailures: Array<{ url: string; status: number; body: string }> = [];
    const relevantConsoleErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' || text.toLowerCase().includes('neuralagent processmessage error')) {
        relevantConsoleErrors.push(text);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('/api/ai/agent')) {
        const isPersistenceEndpoint = url.includes('/api/nodes') || url.includes('/api/edges');
        if (!isPersistenceEndpoint) {
          return;
        }

        const status = response.status();
        if (status < 400) {
          return;
        }

        let body = '';
        try {
          body = await response.text();
        } catch {
          body = '';
        }
        persistenceFailures.push({ url, status, body });
        return;
      }

      const status = response.status();
      if (status < 400) {
        return;
      }

      let body = '';
      try {
        body = await response.text();
      } catch {
        body = '';
      }
      apiFailures.push({ url, status, body });
    });

    await page.goto('/login');
    await expect(page.getByTestId(accountTestId(profileName))).toBeVisible();
    await page.getByTestId(accountTestId(profileName)).click();
    await page.getByTestId('login-password').fill(passwordFor(profileName));
    await page.getByTestId('login-submit').click();
    await page.waitForURL(/dashboard|maps/i, { timeout: 25_000 });

    await page.goto('/maps');
    const mapsCreateButton = page.getByTestId('maps-create-button');
    if (await mapsCreateButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await mapsCreateButton.click();
    } else {
      await page.goto('/dashboard');
      await expect(page.getByRole('button', { name: /criar novo mapa mental/i })).toBeVisible();
      await page.getByRole('button', { name: /criar novo mapa mental/i }).click();
    }
    await page.waitForURL(/\/map\/[a-z0-9-]+/i, { timeout: 25_000 });
    await expect(page.getByTestId('map-editor-root')).toBeVisible();

    await page.getByLabel('Toggle AI agent panel (Ctrl+K)').click();
    await expect(page.getByText('NeuralAgent')).toBeVisible();

    const input = page.getByPlaceholder('Diga o que deseja fazer no mapa...');
    await expect(input).toBeVisible();
    await input.fill('recrie esse mapa');
    await input.press('Enter');

    const streamResponse = await page.waitForResponse(
      (response) =>
        response.url().includes('/api/ai/agent/stream') && response.request().method() === 'POST',
      { timeout: 90_000 }
    );
    expect(streamResponse.status()).toBeLessThan(500);

    await page.waitForTimeout(12_000);

    const protocolErrorNeedle = 'unexpected tool_use_id found in tool_result blocks';
    const failed500AgentCalls = apiFailures.filter((f) => f.status >= 500);
    expect(
      failed500AgentCalls,
      `Agent endpoint returned 5xx: ${JSON.stringify(failed500AgentCalls, null, 2)}`
    ).toHaveLength(0);

    const protocolErrorsInApi = apiFailures.filter((f) =>
      `${f.body}`.toLowerCase().includes(protocolErrorNeedle)
    );
    expect(
      protocolErrorsInApi,
      `Protocol error found in API response: ${JSON.stringify(protocolErrorsInApi, null, 2)}`
    ).toHaveLength(0);

    const protocolErrorsInConsole = relevantConsoleErrors.filter((line) =>
      line.toLowerCase().includes(protocolErrorNeedle)
    );
    expect(
      protocolErrorsInConsole,
      `Protocol error found in browser console: ${JSON.stringify(protocolErrorsInConsole, null, 2)}`
    ).toHaveLength(0);

    const nonRetryablePersistenceErrors = persistenceFailures.filter((f) => {
      const body = f.body.toLowerCase();
      return (
        body.includes('invalid enum value') ||
        body.includes('parent node does not belong to the same map') ||
        body.includes('one or both nodes do not exist in this map')
      );
    });
    expect(
      nonRetryablePersistenceErrors,
      `Persistence errors found: ${JSON.stringify(nonRetryablePersistenceErrors, null, 2)}`
    ).toHaveLength(0);
  });
});
