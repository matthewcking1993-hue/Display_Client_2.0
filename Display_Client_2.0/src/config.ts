import { Capacitor } from '@capacitor/core';

const normalizeAndroidLocalhost = (value: string) => {
  if (!value || Capacitor.getPlatform() !== 'android') {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = '10.0.2.2';
      return parsed.toString();
    }
    return value;
  } catch {
    return value;
  }
};

export const appConfig = {
  displayUrl: normalizeAndroidLocalhost(import.meta.env.VITE_DISPLAY_URL ?? ''),
  apiBaseUrl: normalizeAndroidLocalhost(import.meta.env.VITE_API_BASE_URL ?? ''),
  heartbeatIntervalMs: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL_MS ?? 15000),
  adminPin: import.meta.env.VITE_ADMIN_PIN ?? '2468',
  stationHint: import.meta.env.VITE_STATION_HINT ?? ''
};

export const testingFallback = {
  origin: import.meta.env.VITE_TEST_FALLBACK_ORIGIN ?? 'http://10.0.2.2:32768',
  displayPath: '/display'
};

const normalizeOrigin = (value: string) => {
  if (!value) {
    return '';
  }

  const candidate = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  try {
    const parsed = new URL(candidate);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
};

const deriveServerIdentity = (displayUrl: string, apiBaseUrl: string) => {
  const raw = displayUrl || apiBaseUrl;
  try {
    const parsed = new URL(raw);
    const key = `${parsed.protocol}//${parsed.host}`;
    const defaultPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/display';
    return {
      key,
      origin: `${parsed.protocol}//${parsed.host}`,
      defaultPath,
    };
  } catch {
    return {
      key: 'default',
      origin: '',
      defaultPath: '/display',
    };
  }
};

export const serverIdentity = deriveServerIdentity(appConfig.displayUrl, appConfig.apiBaseUrl);

export const getActiveServerIdentity = () =>
  deriveServerIdentity(appConfig.displayUrl, appConfig.apiBaseUrl);

export const setRuntimeServerOrigin = (origin: string) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    throw new Error('Invalid server origin');
  }

  appConfig.apiBaseUrl = normalizedOrigin;
  appConfig.displayUrl = `${normalizedOrigin}${testingFallback.displayPath}`;
  return getActiveServerIdentity();
};
