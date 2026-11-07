import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface WindowModeReading {
  windowMode: 0 | 1 | 2 | null;
  configFound: boolean;
  configPath: string | null;
}

export function parseWindowMode(text: string): number | null {
  let section = '';
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    const header = trimmed.match(/^\[(.+)]$/);
    if (header) {
      section = header[1].trim().toLowerCase();
      continue;
    }
    if (section !== 'general') continue;
    const match = trimmed.match(/^WindowMode\s*=\s*(-?\d+)\s*$/i);
    if (match) return Number(match[1]);
  }
  return null;
}

export function candidateConfigPaths(executablePath: string | null): string[] {
  const paths: string[] = [];
  if (executablePath) {
    const gameDir = path.dirname(executablePath);
    paths.push(path.resolve(gameDir, '..', 'Config', 'game.cfg'));
  }
  const roots = ['C:', 'D:', 'E:', 'F:'];
  for (const root of roots) {
    paths.push(path.join(root, 'Riot Games', 'League of Legends', 'Config', 'game.cfg'));
  }
  return paths;
}

export function readWindowMode(executablePath: string | null): WindowModeReading {
  for (const configPath of candidateConfigPaths(executablePath)) {
    if (!existsSync(configPath)) continue;
    try {
      const text = readFileSync(configPath, 'utf8');
      const parsed = parseWindowMode(text);
      const windowMode = parsed === 0 || parsed === 1 || parsed === 2 ? parsed : null;
      return { windowMode, configFound: true, configPath };
    } catch {
      return { windowMode: null, configFound: false, configPath: null };
    }
  }
  return { windowMode: null, configFound: false, configPath: null };
}
