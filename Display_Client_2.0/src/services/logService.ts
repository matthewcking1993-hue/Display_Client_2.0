import { useLogStore } from '../state/logStore';
import type { LogEntry } from '../types/device';

const nativeConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

const emit = (entry: LogEntry) => {
  useLogStore.getState().addLog(entry);
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  const entry: LogEntry = {
    level: 'info',
    timestamp: new Date().toISOString(),
    message,
    context
  };
  nativeConsole.log('[info]', message, context ?? {});
  emit(entry);
};

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  const entry: LogEntry = {
    level: 'warn',
    timestamp: new Date().toISOString(),
    message,
    context
  };
  nativeConsole.warn('[warn]', message, context ?? {});
  emit(entry);
};

export const logError = (message: string, context?: Record<string, unknown>) => {
  const entry: LogEntry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    message,
    context
  };
  nativeConsole.error('[error]', message, context ?? {});
  emit(entry);
};

export const setupConsoleCapture = () => {
  console.log = (...args: unknown[]) => {
    recordFromConsole('info', args);
    nativeConsole.log(...args);
  };
  console.warn = (...args: unknown[]) => {
    recordFromConsole('warn', args);
    nativeConsole.warn(...args);
  };
  console.error = (...args: unknown[]) => {
    recordFromConsole('error', args);
    nativeConsole.error(...args);
  };
};

const recordFromConsole = (level: LogEntry['level'], args: unknown[]) => {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message: formatConsoleArgs(args)
  };
  emit(entry);
};

const formatConsoleArgs = (args: unknown[]) =>
  args
    .map((piece) => {
      if (typeof piece === 'string') return piece;
      try {
        return JSON.stringify(piece);
      } catch {
        return String(piece);
      }
    })
    .join(' ');

export const exportLogs = async () => {
  const logs = useLogStore.getState().logs;
  const payload = JSON.stringify(logs, null, 2);
  const defaultName = `kds-logs-${new Date().toISOString()}.json`;

  if (window.kdsBridge?.logging?.exportLogs) {
    await window.kdsBridge.logging.exportLogs(payload, defaultName);
    return;
  }

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = defaultName;
  anchor.click();
  URL.revokeObjectURL(url);
};
