import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, '.reports');
const baselinePath = path.join(rootDir, 'docs', 'quality', 'lint-baseline.json');
const mode = process.argv.includes('--write') ? 'write' : 'check';

const targets = [
  {
    name: 'backend',
    cwd: path.join(rootDir, 'backend'),
    command: [
      'npm',
      'run',
      'lint',
      '--',
      '--format',
      'json',
      '--output-file',
      path.join(reportsDir, 'backend-eslint.json'),
    ],
  },
  {
    name: 'frontend',
    cwd: path.join(rootDir, 'frontend'),
    command: [
      'npx',
      'eslint',
      '.',
      '--ext',
      'ts,tsx',
      '--format',
      'json',
      '--output-file',
      path.join(reportsDir, 'frontend-eslint.json'),
    ],
  },
];

function ensureReportsDir() {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function runCommand(commandArgs, cwd) {
  const [cmd, ...args] = commandArgs;

  let result;

  if (process.platform === 'win32') {
    const commandLine = [cmd, ...args].join(' ');
    result = spawnSync(commandLine, {
      cwd,
      shell: true,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
  } else {
    result = spawnSync(cmd, args, {
      cwd,
      shell: false,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
  }

  // eslint exits with non-zero when it finds problems; this is expected for baseline generation
  if (result.error) {
    throw result.error;
  }
}

function toPosix(value) {
  return value.replaceAll('\\', '/');
}

function deriveModule(filePath, targetName) {
  const normalized = toPosix(filePath);
  const marker = `${targetName}/src/`;
  const idx = normalized.lastIndexOf(marker);

  if (idx === -1) {
    return 'misc';
  }

  const relative = normalized.slice(idx + marker.length);
  const [topLevel] = relative.split('/');
  return topLevel || 'misc';
}

function loadReport(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function summarize(targetName, reportItems) {
  const summary = {
    errors: 0,
    warnings: 0,
    filesWithWarnings: 0,
    filesWithErrors: 0,
    modules: {},
    rules: {},
  };

  for (const item of reportItems) {
    const moduleName = deriveModule(item.filePath || '', targetName);
    const moduleStats =
      summary.modules[moduleName] ||
      (summary.modules[moduleName] = {
        warnings: 0,
        errors: 0,
        files: 0,
        warningRules: {},
      });

    if ((item.warningCount || 0) > 0) {
      summary.filesWithWarnings += 1;
      moduleStats.files += 1;
    }

    if ((item.errorCount || 0) > 0) {
      summary.filesWithErrors += 1;
    }

    summary.warnings += item.warningCount || 0;
    summary.errors += item.errorCount || 0;

    moduleStats.warnings += item.warningCount || 0;
    moduleStats.errors += item.errorCount || 0;

    for (const msg of item.messages || []) {
      if (!msg?.ruleId) continue;
      const ruleId = msg.ruleId;

      if (msg.severity === 1) {
        summary.rules[ruleId] = (summary.rules[ruleId] || 0) + 1;
        moduleStats.warningRules[ruleId] = (moduleStats.warningRules[ruleId] || 0) + 1;
      }
    }
  }

  return summary;
}

function buildSnapshot() {
  ensureReportsDir();

  for (const target of targets) {
    console.log(`\n▶ Running ESLint report for ${target.name}...`);
    runCommand(target.command, target.cwd);
  }

  const backendReport = loadReport(path.join(reportsDir, 'backend-eslint.json'));
  const frontendReport = loadReport(path.join(reportsDir, 'frontend-eslint.json'));

  const backend = summarize('backend', backendReport);
  const frontend = summarize('frontend', frontendReport);

  return {
    generatedAt: new Date().toISOString(),
    strategy: {
      description:
        'Warnings must not increase by module. Reduce by sprint using module budgets in this file.',
      enforcement: 'currentWarnings <= baselineWarnings per module',
    },
    totals: {
      warnings: backend.warnings + frontend.warnings,
      errors: backend.errors + frontend.errors,
    },
    targets: {
      backend,
      frontend,
    },
    sprintBudgets: {
      sprint_1: {
        targetWarningReductionPct: 10,
      },
      sprint_2: {
        targetWarningReductionPct: 20,
      },
      sprint_3: {
        targetWarningReductionPct: 30,
      },
    },
  };
}

function formatDiffTable(current, baseline) {
  const rows = [];

  for (const targetName of ['backend', 'frontend']) {
    const currentModules = current.targets[targetName].modules;
    const baselineModules = baseline.targets[targetName]?.modules || {};

    const moduleNames = Array.from(
      new Set([...Object.keys(currentModules), ...Object.keys(baselineModules)])
    ).sort();

    for (const moduleName of moduleNames) {
      const currentWarnings = currentModules[moduleName]?.warnings || 0;
      const baselineWarnings = baselineModules[moduleName]?.warnings || 0;
      const delta = currentWarnings - baselineWarnings;

      rows.push({
        targetName,
        moduleName,
        baselineWarnings,
        currentWarnings,
        delta,
      });
    }
  }

  return rows;
}

function checkAgainstBaseline(current, baseline) {
  const rows = formatDiffTable(current, baseline);
  const regressions = rows.filter((r) => r.delta > 0);

  const baselineWarnings = baseline.totals?.warnings || 0;
  const currentWarnings = current.totals.warnings;

  console.log('\n=== Lint Baseline Summary ===');
  console.log(`Baseline warnings: ${baselineWarnings}`);
  console.log(`Current warnings:  ${currentWarnings}`);
  console.log(`Delta:             ${currentWarnings - baselineWarnings}`);

  if (regressions.length > 0) {
    console.error('\n❌ Lint warning regressions detected by module:');
    for (const reg of regressions) {
      console.error(
        ` - [${reg.targetName}] ${reg.moduleName}: baseline=${reg.baselineWarnings}, current=${reg.currentWarnings}, delta=+${reg.delta}`
      );
    }
    process.exit(1);
  }

  console.log('\n✅ No lint warning regressions against baseline.');
}

function writeSnapshot(snapshot) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify(snapshot, null, 2));
  console.log(`\n✅ Baseline updated at: ${baselinePath}`);
}

function main() {
  const snapshot = buildSnapshot();

  if (mode === 'write') {
    writeSnapshot(snapshot);
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    console.error(`❌ Baseline not found at ${baselinePath}. Run: npm run lint:baseline:write`);
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  checkAgainstBaseline(snapshot, baseline);
}

main();
