import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, '.reports');
const budgetFile = path.join(rootDir, 'docs', 'quality', 'module-warning-budget.json');

function toPosix(value) {
  return value.replaceAll('\\', '/');
}

function deriveModule(filePath, targetName) {
  const normalized = toPosix(filePath || '');
  const marker = `${targetName}/src/`;
  const idx = normalized.lastIndexOf(marker);

  if (idx === -1) {
    return 'misc';
  }

  const relative = normalized.slice(idx + marker.length);
  const [topLevel] = relative.split('/');
  return topLevel || 'misc';
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function summarizeModules(targetName, reportItems) {
  const modules = {};

  for (const item of reportItems) {
    const moduleName = deriveModule(item.filePath, targetName);
    modules[moduleName] = (modules[moduleName] || 0) + (item.warningCount || 0);
  }

  return modules;
}

function getCurrentWarningsByBudgetKey() {
  const backendReportPath = path.join(reportsDir, 'backend-eslint.json');
  const frontendReportPath = path.join(reportsDir, 'frontend-eslint.json');

  const backend = summarizeModules('backend', loadJson(backendReportPath));
  const frontend = summarizeModules('frontend', loadJson(frontendReportPath));

  const byKey = {};

  for (const [moduleName, warnings] of Object.entries(backend)) {
    byKey[`backend:${moduleName}`] = warnings;
  }

  for (const [moduleName, warnings] of Object.entries(frontend)) {
    byKey[`frontend:${moduleName}`] = warnings;
  }

  return byKey;
}

function main() {
  try {
    const budget = loadJson(budgetFile);
    const currentByKey = getCurrentWarningsByBudgetKey();

    let failed = false;
    let totalBudgetMax = 0;
    let totalCurrent = 0;

    console.log('\n=== Module Warning Budget Check ===');

    for (const item of budget.budgets || []) {
      const key = `${item.target}:${item.module}`;
      const current = currentByKey[key] || 0;
      const max = Number(item.maxWarnings || 0);
      const target = Number(item.targetWarnings ?? max);
      const delta = current - max;
      const toTarget = current - target;

      totalBudgetMax += max;
      totalCurrent += current;

      if (delta > 0) {
        failed = true;
        console.error(
          `❌ ${key} exceeded budget: current=${current}, max=${max}, over=+${delta}, owner=${item.owner}`
        );
      } else {
        const progressLabel =
          toTarget <= 0
            ? `target met (target=${target})`
            : `remaining to target=${toTarget} (target=${target})`;
        console.log(
          `✅ ${key}: current=${current}, max=${max}, slack=${Math.abs(delta)}, ${progressLabel}`
        );
      }
    }

    console.log('\n--- Totals (tracked modules only) ---');
    console.log(`Tracked current warnings: ${totalCurrent}`);
    console.log(`Tracked budget max:      ${totalBudgetMax}`);

    if (failed) {
      process.exit(1);
    }

    console.log('\n✅ Module warning budgets satisfied.');
  } catch (error) {
    console.error('\n❌ Unable to run module warning budget check');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nHint: run `npm run lint:baseline:check` first to generate .reports/*.json');
    process.exit(1);
  }
}

main();
