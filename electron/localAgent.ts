import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { app } from 'electron';

/**
 * Starts the bundled local agent (lolanalyzer-agent.exe) on 127.0.0.1 with a
 * random per-launch token, and stops it when the app quits.
 * In development nothing is started: the full backend on :8000 answers.
 */

const FIRST_PORT = 8765;
const LAST_PORT = 8785;
const READY_TIMEOUT_MS = 20_000;

export interface AgentInfo {
  url: string;
  token: string;
}

function agentExecutable(): string | null {
  const configured = process.env.LOLANALYZER_AGENT_PATH;
  const candidate = configured || path.join(process.resourcesPath, 'agent', 'lolanalyzer-agent.exe');
  return fs.existsSync(candidate) ? candidate : null;
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

async function freePort(): Promise<number> {
  for (let port = FIRST_PORT; port <= LAST_PORT; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error('No hay un puerto libre para el agente local.');
}

async function waitUntilReady(url: string): Promise<boolean> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return true;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

export class LocalAgent {
  private child: ChildProcess | null = null;
  private info: AgentInfo | null = null;
  private starting: Promise<AgentInfo | null> | null = null;

  /** Null in development or when the executable is missing. */
  current(): Promise<AgentInfo | null> {
    return this.starting ?? Promise.resolve(this.info);
  }

  start(cloudUrl: string): Promise<AgentInfo | null> {
    if (this.starting) return this.starting;
    this.starting = this.launch(cloudUrl).catch((error: unknown) => {
      console.error('[agent] no se pudo iniciar el agente local', error);
      return null;
    });
    return this.starting;
  }

  stop(): void {
    if (this.child && !this.child.killed) this.child.kill();
    this.child = null;
  }

  private async launch(cloudUrl: string): Promise<AgentInfo | null> {
    if (!app.isPackaged && !process.env.LOLANALYZER_AGENT_PATH) return null;
    const exe = agentExecutable();
    if (!exe) {
      console.warn('[agent] no se encontró lolanalyzer-agent.exe');
      return null;
    }
    const port = await freePort();
    const token = randomBytes(32).toString('hex');
    this.child = spawn(exe, [], {
      cwd: path.dirname(exe),
      windowsHide: true,
      stdio: 'ignore',
      env: {
        SYSTEMROOT: process.env.SYSTEMROOT ?? '',
        PATH: process.env.PATH ?? '',
        TEMP: process.env.TEMP ?? '',
        TMP: process.env.TMP ?? '',
        LOCALAPPDATA: process.env.LOCALAPPDATA ?? '',
        LOLANALYZER_AGENT_TOKEN: token,
        LOLANALYZER_AGENT_PORT: String(port),
        LOLANALYZER_CLOUD_URL: cloudUrl,
        LOLANALYZER_PARENT_PID: String(process.pid),
      },
    });
    this.child.once('exit', (code) => {
      console.warn(`[agent] el agente local terminó (código ${code ?? 'n/a'})`);
      this.child = null;
    });
    const url = `http://127.0.0.1:${port}`;
    if (!(await waitUntilReady(url))) {
      this.stop();
      throw new Error('El agente local no respondió a tiempo.');
    }
    this.info = { url, token };
    return this.info;
  }
}
