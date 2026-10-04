#!/usr/bin/env node
// Build entry point used by Vercel (buildCommand in vercel.json).
//
// Vercel sets VERCEL_ENV to "production" (branch `main`), "preview" (any other
// branch, e.g. `staging`) or "development". Production gets the production
// Angular configuration (environment.prod.ts → api.cremacuadrado.com); every
// other environment gets `staging` (environment.staging.ts → api-stg).
//
// The prerender step reads the product catalog from the API at build time, so
// it must query the same backend the build is configured for.
import { spawnSync } from 'node:child_process';

const isProduction = process.env.VERCEL_ENV === 'production';
const configuration = isProduction ? 'production' : 'staging';
const apiUrl = isProduction
  ? 'https://api.cremacuadrado.com/api/v1'
  : 'https://api-stg.cremacuadrado.com/api/v1';

console.log(`[build-vercel] VERCEL_ENV=${process.env.VERCEL_ENV ?? '(unset)'} → configuración "${configuration}", API ${apiUrl}`);

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('node', ['scripts/generate-prerender-routes.mjs'], {
  PRERENDER_API_URL: process.env.PRERENDER_API_URL ?? apiUrl,
});
run('npx', ['ng', 'build', '--configuration', configuration]);
