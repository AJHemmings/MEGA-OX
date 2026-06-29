import { SerializedState } from './gameSerializer';

export interface BugReportContext {
  page: string;
  game_id: string | null;
  user_agent: string;
  screen: string;
  recent_errors: string[];
  game_state: SerializedState | null;
}

const MAX_ERRORS = 5;
const MAX_ERROR_LEN = 500;
const errorBuffer: string[] = [];
let registered = false;

export function initErrorCapture(): void {
  if (registered) return;
  registered = true;

  window.onerror = (msg, _src, _line, _col, err) => {
    const entry = err?.stack ?? String(msg);
    errorBuffer.push(entry.slice(0, MAX_ERROR_LEN));
    if (errorBuffer.length > MAX_ERRORS) errorBuffer.shift();
  };

  window.addEventListener('unhandledrejection', (e) => {
    // Supabase Realtime uses the Web Locks API internally. In dev, React
    // StrictMode double-invokes effects, causing the second channel subscription
    // to steal the lock from the first. The resulting AbortError is harmless in
    // production (StrictMode is dev-only) but triggers CRA's error overlay.
    if (e.reason?.name === 'AbortError' && String(e.reason?.message).includes('Lock broken')) {
      e.preventDefault();
      return;
    }
    const entry = (e.reason instanceof Error)
      ? (e.reason.stack ?? e.reason.message)
      : String(e.reason);
    errorBuffer.push(entry.slice(0, MAX_ERROR_LEN));
    if (errorBuffer.length > MAX_ERRORS) errorBuffer.shift();
  });
}

export function getRecentErrors(): string[] {
  return [...errorBuffer];
}

export function captureContext(opts?: {
  gameId?: string | null;
  gameState?: SerializedState | null;
}): BugReportContext {
  return {
    page:          window.location.pathname,
    game_id:       opts?.gameId ?? null,
    user_agent:    navigator.userAgent,
    screen:        `${window.screen.width}x${window.screen.height}`,
    recent_errors: getRecentErrors(),
    game_state:    opts?.gameState ?? null,
  };
}
