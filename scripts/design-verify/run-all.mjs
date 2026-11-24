/**
 * Run every design verification script against a production build.
 *
 * Starts `next start` on a dedicated port, waits for readiness, runs each
 * assertion script, then always stops the server in a finally block. This
 * leaves no orphaned dev server competing with other services on the host.
 *
 * Usage: node scripts/design-verify/run-all.mjs
 * Requires: corepack yarn build (a production .next build).
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = process.env.DESIGN_VERIFY_PORT ?? '3100';
const BASE = `http://localhost:${PORT}`;
const SCRIPTS = ['tokens', 'primitives', 'player', 'reciter-list', 'shell'];

const server = spawn('corepack', ['yarn', 'start', '-p', PORT], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=2048' },
  // Own a process group so the whole `corepack yarn start` tree (including the
  // `next start` grandchild) can be stopped in one signal.
  detached: true,
});
let serverLog = '';
server.stdout.on('data', (d) => {
  serverLog += String(d);
});
server.stderr.on('data', (d) => {
  serverLog += String(d);
});

const stopServer = () => {
  if (server.exitCode === null && !server.killed) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
};

let failed = [];
try {
  let ready = false;
  for (let index = 0; index < 60; index += 1) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* still starting */
    }
    if (server.exitCode !== null) break;
    await sleep(1000);
  }
  if (!ready)
    throw new Error(`server did not become ready:\n${serverLog.slice(-2000)}`);

  for (const name of SCRIPTS) {
    const child = spawn(
      process.execPath,
      [`scripts/design-verify/${name}.mjs`],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: { ...process.env, DESIGN_VERIFY_PORT: PORT },
      }
    );
    const [code] = await once(child, 'exit');
    if (code !== 0) failed.push(`${name} (exit ${code})`);
    console.log(`--- ${name}: ${code === 0 ? 'PASS' : 'FAIL'} ---`);
  }
} catch (error) {
  failed.push(
    `runner: ${error instanceof Error ? error.message : String(error)}`
  );
} finally {
  stopServer();
  await Promise.race([once(server, 'exit'), sleep(5000)]);
}

if (failed.length > 0) {
  console.error('FAILED:', failed.join(', '));
  process.exit(1);
}
console.log('ALL VERIFICATION SCRIPTS PASSED');
