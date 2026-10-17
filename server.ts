import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const isTsxRunning =
  process.env.__TSX_RUNNING__ === 'true' ||
  process.execArgv.some((a) => a.includes('tsx/dist/loader.mjs') || a.includes('tsx'));

if (!isTsxRunning) {
  // In ambiente di produzione Cloud Run ("node server.ts"), avvia il processo con il loader tsx nativo
  const currentFile = fileURLToPath(import.meta.url);
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', currentFile, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: { ...process.env, __TSX_RUNNING__: 'true' },
    }
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error('[Server Spawn Error]', err);
    process.exit(1);
  });
} else {
  // Avvia il server applicativo completo
  const { startServer } = await import('./server-core.ts');
  startServer();
}
