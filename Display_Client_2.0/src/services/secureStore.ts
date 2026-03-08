import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const DEVICE_KEY = 'kds/device-id';
const LEGACY_STATION_KEY = 'kds/station-assignment';
const BINDINGS_KEY = 'kds/server-bindings';

const isWeb = () => Capacitor.getPlatform() === 'web';

interface ServerBinding {
  stationId?: string | null;
  displayPath?: string | null;
  locationId?: string | null;
}

const readRaw = async (key: string): Promise<string | null> => {
  if (isWeb()) {
    return localStorage.getItem(key);
  }
  const { value } = await Preferences.get({ key });
  return value ?? null;
};

const writeRaw = async (key: string, value: string) => {
  if (isWeb()) {
    localStorage.setItem(key, value);
    return;
  }
  await Preferences.set({ key, value });
};

const removeRaw = async (key: string) => {
  if (isWeb()) {
    localStorage.removeItem(key);
    return;
  }
  await Preferences.remove({ key });
};

const readLegacyStationValue = async (): Promise<string | null> => {
  if (window.kdsBridge?.storage?.readStationAssignment) {
    try {
      return await window.kdsBridge.storage.readStationAssignment();
    } catch {
      // Fall through to on-device storage
    }
  }
  return readRaw(LEGACY_STATION_KEY);
};

const readBindings = async (): Promise<Record<string, ServerBinding>> => {
  const raw = await readRaw(BINDINGS_KEY);
  if (!raw) {
    const legacyValue = await readLegacyStationValue();
    if (legacyValue) {
      return { default: { stationId: legacyValue } };
    }
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, ServerBinding>;
    }
  } catch {
    // corrupted JSON, reset below
  }
  return {};
};

const persistBindings = async (bindings: Record<string, ServerBinding>) => {
  if (!bindings || Object.keys(bindings).length === 0) {
    await removeRaw(BINDINGS_KEY);
    return;
  }
  await writeRaw(BINDINGS_KEY, JSON.stringify(bindings));
};

export const readServerBinding = async (serverKey: string): Promise<ServerBinding | null> => {
  if (window.kdsBridge?.storage?.readServerBinding) {
    try {
      return await window.kdsBridge.storage.readServerBinding(serverKey);
    } catch {
      // Fall back to local store
    }
  }
  const bindings = await readBindings();
  return bindings[serverKey] ?? null;
};

export const writeServerBinding = async (serverKey: string, updates: Partial<ServerBinding>) => {
  if (window.kdsBridge?.storage?.writeServerBinding) {
    await window.kdsBridge.storage.writeServerBinding(serverKey, updates as ServerBinding);
    return;
  }
  const bindings = await readBindings();
  const current = bindings[serverKey] || {};
  const next = { ...current, ...updates };
  bindings[serverKey] = next;
  await persistBindings(bindings);
};

export const clearServerBinding = async (serverKey: string) => {
  if (window.kdsBridge?.storage?.writeServerBinding) {
    await window.kdsBridge.storage.writeServerBinding(serverKey, {
      stationId: null,
      displayPath: null,
      locationId: null
    });
    return;
  }
  const bindings = await readBindings();
  if (bindings[serverKey]) {
    delete bindings[serverKey];
    await persistBindings(bindings);
  }
};

export const readDeviceId = async (): Promise<string | null> => {
  if (window.kdsBridge?.storage?.readDeviceId) {
    return window.kdsBridge.storage.readDeviceId();
  }

  if (isWeb()) {
    return localStorage.getItem(DEVICE_KEY);
  }

  const { value } = await Preferences.get({ key: DEVICE_KEY });
  return value ?? null;
};

export const writeDeviceId = async (deviceId: string) => {
  if (window.kdsBridge?.storage?.writeDeviceId) {
    await window.kdsBridge.storage.writeDeviceId(deviceId);
    return;
  }

  if (isWeb()) {
    localStorage.setItem(DEVICE_KEY, deviceId);
    return;
  }

  await Preferences.set({ key: DEVICE_KEY, value: deviceId });
};

export const readStationAssignment = async (serverKey = 'default'): Promise<string | null> => {
  const binding = await readServerBinding(serverKey);
  return binding?.stationId ?? null;
};

export const writeStationAssignment = async (station: string | null, serverKey = 'default') => {
  if (serverKey === 'default' && window.kdsBridge?.storage?.writeStationAssignment) {
    await window.kdsBridge.storage.writeStationAssignment(station);
  }
  await writeServerBinding(serverKey, { stationId: station });
};
