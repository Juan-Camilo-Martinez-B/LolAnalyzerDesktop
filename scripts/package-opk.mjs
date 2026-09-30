import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(project, 'dist');
const release = resolve(project, 'release');
const zipPath = resolve(release, 'LolAnalyzer.zip');
const opkPath = resolve(release, 'LolAnalyzer.opk');

if (!existsSync(resolve(dist, 'manifest.json'))) {
  console.error('Falta dist/manifest.json. Ejecuta npm run build antes de empaquetar.');
  process.exit(1);
}

mkdirSync(release, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);
if (existsSync(opkPath)) rmSync(opkPath);

if (process.platform === 'win32') {
  const command = `Compress-Archive -Path '${dist}\\*' -DestinationPath '${zipPath}' -Force`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    stdio: 'inherit',
  });
} else {
  execFileSync('zip', ['-r', zipPath, '.'], { cwd: dist, stdio: 'inherit' });
}

renameSync(zipPath, opkPath);
console.log(`OPK listo: ${opkPath}`);
