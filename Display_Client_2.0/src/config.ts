export const appConfig = {
  displayUrl: import.meta.env.VITE_DISPLAY_URL ?? '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  heartbeatIntervalMs: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL_MS ?? 15000),
  adminPin: import.meta.env.VITE_ADMIN_PIN ?? '2468',
  stationHint: import.meta.env.VITE_STATION_HINT ?? ''
};

const deriveServerIdentity = () => {
  const raw = appConfig.displayUrl || appConfig.apiBaseUrl;
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

export const serverIdentity = deriveServerIdentity();
