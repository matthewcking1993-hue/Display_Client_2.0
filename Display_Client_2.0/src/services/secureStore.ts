import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const DEVICE_KEY = 'kds/device-id';
const STATION_KEY = 'kds/station-assignment';

const isWeb = () => Capacitor.getPlatform() === 'web';

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

export const readStationAssignment = async (): Promise<string | null> => {
  if (window.kdsBridge?.storage?.readStationAssignment) {
    return window.kdsBridge.storage.readStationAssignment();
  }

  if (isWeb()) {
    return localStorage.getItem(STATION_KEY);
  }

  const { value } = await Preferences.get({ key: STATION_KEY });
  return value ?? null;
};

export const writeStationAssignment = async (station: string | null) => {
  if (window.kdsBridge?.storage?.writeStationAssignment) {
    await window.kdsBridge.storage.writeStationAssignment(station);
    return;
  }

  if (isWeb()) {
    if (station) {
      localStorage.setItem(STATION_KEY, station);
    } else {
      localStorage.removeItem(STATION_KEY);
    }
    return;
  }

  if (!station) {
    await Preferences.remove({ key: STATION_KEY });
    return;
  }

  await Preferences.set({ key: STATION_KEY, value: station });
};
