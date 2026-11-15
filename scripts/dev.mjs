import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Astro 7 auto-backgrounds `astro dev` when it detects an AI agent environment.
// That background handshake can time out on WSL/Windows mounts. This wrapper
// forces a normal foreground dev server so `npm run dev` remains usable.
const astroBin = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
const child = spawn(process.execPath, [astroBin, 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ASTRO_DEV_BACKGROUND: '0'
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
