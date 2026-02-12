const mode = process.argv[2] || 'smoke-public';

const validators = {
  'smoke-public': {
    required: ['SMOKE_FRONTEND_URL', 'SMOKE_BACKEND_URL'],
  },
  'smoke-auth': {
    required: ['SMOKE_FRONTEND_URL', 'SMOKE_BACKEND_URL', 'SMOKE_BEARER_TOKEN'],
  },
};

if (!validators[mode]) {
  console.error(`❌ Unknown mode: ${mode}`);
  console.error(`Allowed modes: ${Object.keys(validators).join(', ')}`);
  process.exit(1);
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function maskToken(value) {
  if (!value) return '[empty]';
  if (value.length <= 12) return '[masked]';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function validate() {
  const { required } = validators[mode];
  const missing = [];

  for (const key of required) {
    if (!process.env[key] || String(process.env[key]).trim().length === 0) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for mode '${mode}':`);
    missing.forEach((k) => console.error(` - ${k}`));
    process.exit(1);
  }

  const frontend = process.env.SMOKE_FRONTEND_URL;
  const backend = process.env.SMOKE_BACKEND_URL;

  if (frontend && !isHttpUrl(frontend)) {
    console.error(`❌ Invalid SMOKE_FRONTEND_URL: ${frontend}`);
    process.exit(1);
  }

  if (backend && !isHttpUrl(backend)) {
    console.error(`❌ Invalid SMOKE_BACKEND_URL: ${backend}`);
    process.exit(1);
  }

  console.log(`✅ Preflight (${mode}) passed`);
  console.log(` - SMOKE_FRONTEND_URL: ${frontend}`);
  console.log(` - SMOKE_BACKEND_URL:  ${backend}`);

  if (mode === 'smoke-auth') {
    console.log(` - SMOKE_BEARER_TOKEN: ${maskToken(process.env.SMOKE_BEARER_TOKEN)}`);
  }
}

validate();
