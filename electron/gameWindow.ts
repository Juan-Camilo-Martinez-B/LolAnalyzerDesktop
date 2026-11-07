import koffi from 'koffi';

const GAME_EXE = 'league of legends.exe';
const GAME_TITLE = 'league of legends (tm) client';
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

export interface LeagueWindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  title: string;
  executablePath: string | null;
}

interface Candidate extends LeagueWindowBounds {
  area: number;
  processMatched: boolean;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

let bindingsFailed = false;

const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

const RECT = koffi.struct('RECT', {
  left: 'long',
  top: 'long',
  right: 'long',
  bottom: 'long',
});
void RECT;

const enumWindowsProc = koffi.proto('int __stdcall EnumWindowsProc(void *hwnd, intptr_t lParam)');
const EnumWindows = user32.func('int __stdcall EnumWindows(EnumWindowsProc *cb, intptr_t lParam)');
const IsWindowVisible = user32.func('int __stdcall IsWindowVisible(void *hwnd)');
const IsIconic = user32.func('int __stdcall IsIconic(void *hwnd)');
const GetWindowTextW = user32.func('int __stdcall GetWindowTextW(void *hwnd, void *buf, int max)');
const GetWindowRect = user32.func('int __stdcall GetWindowRect(void *hwnd, _Out_ RECT *rect)');
const GetWindowThreadProcessId = user32.func('uint32 __stdcall GetWindowThreadProcessId(void *hwnd, _Out_ uint32 *pid)');
const OpenProcess = kernel32.func('void * __stdcall OpenProcess(uint32 access, int inherit, uint32 pid)');
const CloseHandle = kernel32.func('int __stdcall CloseHandle(void *handle)');
const QueryFullProcessImageNameW = kernel32.func(
  'int __stdcall QueryFullProcessImageNameW(void *process, uint32 flags, void *buf, _Inout_ uint32 *size)',
);

function markReady(): boolean {
  return !bindingsFailed;
}

function readTitle(hwnd: unknown): string {
  const buf = Buffer.alloc(512);
  const written = Number(GetWindowTextW(hwnd, buf, 256));
  if (!Number.isFinite(written) || written <= 0) return '';
  return buf.toString('utf16le', 0, written * 2).replace(/\0+$/, '');
}

function readExecutable(pid: number): string | null {
  if (!pid) return null;
  const handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
  if (!handle) return null;
  try {
    const chars = 1024;
    const buf = Buffer.alloc(chars * 2);
    const size = [chars];
    const ok = Number(QueryFullProcessImageNameW(handle, 0, buf, size));
    if (!ok) return null;
    const count = size[0] ?? 0;
    if (count <= 0) return null;
    return buf.toString('utf16le', 0, count * 2).replace(/\0+$/, '');
  } finally {
    CloseHandle(handle);
  }
}

function isGameExecutable(executablePath: string | null): boolean {
  if (!executablePath) return false;
  const normalized = executablePath.replaceAll('/', '\\').toLowerCase();
  return normalized.endsWith(`\\${GAME_EXE}`) || normalized.endsWith(GAME_EXE);
}

function isGameTitle(title: string): boolean {
  return title.trim().toLowerCase() === GAME_TITLE;
}

function inspect(hwnd: unknown, found: Candidate[]): void {
  const title = readTitle(hwnd);
  const pidOut = [0];
  GetWindowThreadProcessId(hwnd, pidOut);
  const executablePath = readExecutable(pidOut[0] ?? 0);
  const processMatched = isGameExecutable(executablePath);
  if (!processMatched && !isGameTitle(title)) return;

  const rect = {} as Rect;
  const ok = Number(GetWindowRect(hwnd, rect));
  const width = ok ? rect.right - rect.left : 0;
  const height = ok ? rect.bottom - rect.top : 0;
  const minimized = Number(IsIconic(hwnd)) !== 0 || Number(IsWindowVisible(hwnd)) === 0;
  found.push({
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    width,
    height,
    minimized,
    title,
    executablePath,
    area: Math.max(0, width) * Math.max(0, height),
    processMatched,
  });
}

/** Physical-pixel bounds of League of Legends.exe, or null when it is not open. */
export function findLeagueWindow(): LeagueWindowBounds | null {
  if (!markReady()) return null;
  const found: Candidate[] = [];
  const callback = koffi.register((hwnd: unknown) => {
    try {
      inspect(hwnd, found);
    } catch {
      // One bad window must not stop the scan.
    }
    return 1;
  }, koffi.pointer(enumWindowsProc));

  try {
    EnumWindows(callback, 0);
  } catch (error) {
    bindingsFailed = true;
    console.warn('[electron] no se pudo enumerar las ventanas de League', error);
    return null;
  } finally {
    koffi.unregister(callback);
  }

  const matched = found.filter((item) => item.processMatched);
  const pool = matched.length > 0 ? matched : found.filter((item) => isGameTitle(item.title));
  if (pool.length === 0) return null;
  const visible = pool.filter((item) => !item.minimized && item.width > 0 && item.height > 0);
  const choice = (visible.length > 0 ? visible : pool).sort((a, b) => b.area - a.area)[0];
  return {
    x: choice.x,
    y: choice.y,
    width: choice.width,
    height: choice.height,
    minimized: choice.minimized || choice.width <= 0 || choice.height <= 0,
    title: choice.title,
    executablePath: choice.executablePath,
  };
}
