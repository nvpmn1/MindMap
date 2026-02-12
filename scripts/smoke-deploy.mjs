const backendUrl = process.env.SMOKE_BACKEND_URL;
const frontendUrl = process.env.SMOKE_FRONTEND_URL;
const bearerToken = process.env.SMOKE_BEARER_TOKEN;
const keepResources = process.env.SMOKE_KEEP_RESOURCES === 'true';
const aiPrompt = process.env.SMOKE_AI_PROMPT || 'Resuma este mapa em uma frase curta';

if (!backendUrl || !frontendUrl) {
  console.error('❌ Missing required env vars: SMOKE_BACKEND_URL and SMOKE_FRONTEND_URL');
  process.exit(1);
}

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const healthMaxAttempts = Number(process.env.SMOKE_HEALTH_MAX_ATTEMPTS || 8);
const healthRetryDelayMs = Number(process.env.SMOKE_HEALTH_RETRY_DELAY_MS || 12000);

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
}

async function requestJson(url, options = {}) {
  const { controller, timeout } = withTimeout(timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    const bodyText = await response.text();
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      body = bodyText;
    }

    return { response, body };
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJsonWithRetry(url, options = {}, retryConfig = {}) {
  const {
    attempts = healthMaxAttempts,
    delayMs = healthRetryDelayMs,
    retryOnStatuses = [502, 503, 504, 429],
    stepName = 'request',
  } = retryConfig;

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await requestJson(url, options);
      if (!retryOnStatuses.includes(result.response.status)) {
        return result;
      }

      lastError = new Error(
        `${stepName} attempt ${attempt}/${attempts}: status ${result.response.status}`
      );

      if (attempt < attempts) {
        console.log(
          `⏳ ${stepName} got ${result.response.status}. Waiting ${delayMs}ms before retry... (${attempt}/${attempts})`
        );
        await sleep(delayMs);
      }
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.log(
          `⏳ ${stepName} network error. Waiting ${delayMs}ms before retry... (${attempt}/${attempts})`
        );
        await sleep(delayMs);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function assertStatus(step, response, expectedStatuses = [200]) {
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${step} failed: expected ${expectedStatuses.join('/')} got ${response.status}`
    );
  }
}

async function main() {
  console.log('\n🚬 Running production smoke test...');

  // Public checks
  {
    const { response } = await requestJson(`${frontendUrl.replace(/\/$/, '')}/`);
    assertStatus('Frontend homepage', response, [200, 301, 302, 307, 308]);
    console.log('✅ Frontend reachable');
  }

  {
    const { response, body } = await requestJsonWithRetry(
      `${backendUrl.replace(/\/$/, '')}/health`,
      {},
      { stepName: 'Backend /health warm-up' }
    );
    assertStatus('Backend /health', response, [200]);
    if (!body || body.status !== 'ok') {
      throw new Error('Backend /health response does not contain status=ok');
    }
    console.log('✅ Backend health endpoint OK');
  }

  {
    const { response, body } = await requestJson(
      `${backendUrl.replace(/\/$/, '')}/health/detailed`
    );
    assertStatus('Backend /health/detailed', response, [200, 503]);
    if (!body || !body.checks) {
      throw new Error('Backend /health/detailed response is missing checks payload');
    }
    console.log('✅ Backend detailed health responded');
  }

  if (!bearerToken) {
    console.log(
      '⚠️ SMOKE_BEARER_TOKEN not provided. Skipping authenticated map/AI/persistence checks.'
    );
    process.exit(0);
  }

  const authHeaders = {
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
  };

  // Auth check
  const me = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/auth/me`, {
    method: 'GET',
    headers: authHeaders,
  });
  assertStatus('GET /api/auth/me', me.response, [200]);
  if (!me.body?.data?.workspaces?.[0]?.id) {
    throw new Error('Auth check failed: no accessible workspace found in /api/auth/me');
  }
  console.log('✅ Auth validated via /api/auth/me');

  const workspaceId = process.env.SMOKE_WORKSPACE_ID || me.body.data.workspaces[0].id;

  // Map create
  const mapTitle = `SMOKE ${new Date().toISOString()}`;
  const createdMap = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/maps`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      workspace_id: workspaceId,
      title: mapTitle,
      description: 'smoke test map',
    }),
  });
  assertStatus('POST /api/maps', createdMap.response, [201]);
  const mapId = createdMap.body?.data?.id;
  if (!mapId) throw new Error('Map creation did not return map id');
  console.log(`✅ Map created (${mapId})`);

  // Map edit
  const editedTitle = `${mapTitle} - updated`;
  const updatedMap = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/maps/${mapId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ title: editedTitle }),
  });
  assertStatus('PATCH /api/maps/:mapId', updatedMap.response, [200]);
  console.log('✅ Map edit endpoint OK');

  // Node create + update (persistence probe)
  const createdNode = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/nodes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      map_id: mapId,
      type: 'idea',
      label: 'Smoke node',
      content: 'Created by smoke test',
      position_x: 120,
      position_y: 80,
    }),
  });
  assertStatus('POST /api/nodes', createdNode.response, [201]);
  const nodeId = createdNode.body?.data?.id;
  if (!nodeId) throw new Error('Node creation did not return node id');

  const updatedNode = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/nodes/${nodeId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      label: 'Smoke node updated',
      content: 'Smoke persistence check',
      position_x: 180,
      position_y: 120,
    }),
  });
  assertStatus('PATCH /api/nodes/:nodeId', updatedNode.response, [200]);
  console.log('✅ Node create/edit persistence path OK');

  // AI tool-use check (chat path)
  const ai = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/ai/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      map_id: mapId,
      message: aiPrompt,
      context: {
        nodes: [
          {
            id: nodeId,
            label: 'Smoke node updated',
            type: 'idea',
            content: 'Smoke persistence check',
          },
        ],
      },
    }),
  });
  assertStatus('POST /api/ai/chat', ai.response, [200]);
  console.log('✅ AI endpoint responded');

  // Final map read (persistence verification)
  const fetchedMap = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/maps/${mapId}`, {
    method: 'GET',
    headers: authHeaders,
  });
  assertStatus('GET /api/maps/:mapId', fetchedMap.response, [200]);
  if (fetchedMap.body?.data?.title !== editedTitle) {
    throw new Error('Persistence validation failed: edited map title not found');
  }
  console.log('✅ Persistence verified by map re-fetch');

  if (!keepResources) {
    const deletedMap = await requestJson(`${backendUrl.replace(/\/$/, '')}/api/maps/${mapId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assertStatus('DELETE /api/maps/:mapId', deletedMap.response, [200]);
    console.log('✅ Cleanup completed (smoke map deleted)');
  }

  console.log('\n🎉 Smoke test completed successfully.');
}

main().catch((error) => {
  console.error('\n❌ Smoke test failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
