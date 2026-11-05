#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { fetchPackument } = require('../src/registry');
const { checkTyposquat } = require('../src/typosquat');
const { checkMaintainerChange } = require('../src/maintainer-change');

function loadDependencyNames(targetPath) {
  const pkgPath = path.join(targetPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`No package.json found at ${pkgPath}`);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const names = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);
  return [...names];
}

async function scanPackage(name) {
  const findings = [];
  const typo = checkTyposquat(name);
  if (typo) findings.push(typo);

  try {
    const packument = await fetchPackument(name);
    const maintainerRisk = checkMaintainerChange(packument);
    if (maintainerRisk) findings.push(maintainerRisk);
  } catch (err) {
    findings.push({ type: 'lookup-error', package: name, message: err.message });
  }

  return findings;
}

function printFinding(f) {
  if (f.type === 'typosquat-risk') {
    console.log(`  \x1b[33m[typosquat?]\x1b[0m "${f.package}" is 1-2 characters from popular package "${f.similarTo}"`);
  } else if (f.type === 'maintainer-change-risk') {
    console.log(`  \x1b[31m[ownership change]\x1b[0m "${f.package}@${f.latestVersion}" published ${f.publishedAt} by new account "${f.newPublisher}" after a stable history under "${f.previousPublisher}"`);
  } else if (f.type === 'lookup-error') {
    console.log(`  \x1b[90m[skip]\x1b[0m "${f.package}": ${f.message}`);
  }
}

async function main() {
  const targetPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const names = loadDependencyNames(targetPath);

  if (names.length === 0) {
    console.log('No dependencies found.');
    return;
  }

  console.log(`depguard: scanning ${names.length} dependencies in ${targetPath}\n`);

  const CONCURRENCY = 10;
  let cursor = 0;
  let flaggedCount = 0;

  async function worker() {
    while (cursor < names.length) {
      const name = names[cursor++];
      const findings = await scanPackage(name);
      const real = findings.filter((f) => f.type !== 'lookup-error');
      if (real.length > 0) {
        flaggedCount += real.length;
        findings.forEach(printFinding);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\ndepguard: ${flaggedCount} risk signal(s) across ${names.length} dependencies.`);
  if (flaggedCount > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('depguard: fatal error:', err.message);
  process.exit(1);
});
