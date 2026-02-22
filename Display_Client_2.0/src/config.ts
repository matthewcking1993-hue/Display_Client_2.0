export const appConfig = {
  displayUrl: import.meta.env.VITE_DISPLAY_URL ?? '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  heartbeatIntervalMs: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL_MS ?? 15000),
  adminPin: import.meta.env.VITE_ADMIN_PIN ?? '2468',
  stationHint: import.meta.env.VITE_STATION_HINT ?? ''
};
