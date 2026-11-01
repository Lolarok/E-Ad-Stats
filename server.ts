import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Verifica se tsx è già attivo nell'ambiente di esecuzione
const isTsxActive =
  process.env.__TSX_ACTIVE__ === 'true' ||
  process.execArgv.some((a) => a.includes('tsx'));

if (!isTsxActive) {
  // In ambiente di produzione Cloud Run ("node server.ts"), esegui con il loader tsx nativo
  const currentFile = fileURLToPath(import.meta.url);
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', currentFile, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: { ...process.env, __TSX_ACTIVE__: 'true' },
    }
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error('[Server Spawn Error]', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    try {
      child.kill('SIGTERM');
    } catch (e) {}
  });

  process.on('SIGINT', () => {
    try {
      child.kill('SIGINT');
    } catch (e) {}
  });
} else {
  // Avvia il server applicativo completo
  const { startServer } = await import('./server-core.ts');
  startServer().catch((err) => {
    console.error('[Server Start Error]', err);
    process.exit(1);
  });
}
