import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import type { DeviceMetadata } from '../types/device';
import { appConfig, serverIdentity } from '../config';

export const collectDeviceMetadata = async (): Promise<DeviceMetadata> => {
  if (window.kdsBridge?.device?.getMetadata) {
    return window.kdsBridge.device.getMetadata();
  }

  const info = await Device.getInfo();
  const screen = window.screen;
  const orientation = screen.orientation?.type ?? (screen.width >= screen.height ? 'landscape' : 'portrait');

  return {
    platform: info.platform,
    osVersion: info.osVersion ?? 'unknown',
    model: info.model ?? 'unknown',
    manufacturer: info.manufacturer,
    isVirtual: info.isVirtual,
    screen: {
      width: screen.width,
      height: screen.height,
      density: window.devicePixelRatio,
      orientation,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    },
    appVersion: __APP_VERSION__
  };
};

interface DisplayUrlOptions {
  deviceId: string;
  station?: string | null;
  displayPath?: string | null;
}

const buildUrlFromPath = (path: string) => {
  const origin = serverIdentity.origin || (appConfig.displayUrl ? new URL(appConfig.displayUrl).origin : '');
  if (!origin) {
    return null;
  }
  try {
    return new URL(path, origin);
  } catch {
    return null;
  }
};

export const buildDisplayUrl = ({ deviceId, station, displayPath }: DisplayUrlOptions) => {
  if (displayPath) {
    const target = buildUrlFromPath(displayPath);
    if (target) {
      target.searchParams.set('deviceId', deviceId);
      if (station) {
        target.searchParams.set('station', station);
      }
      return target.toString();
    }
  }

  if (!appConfig.displayUrl) {
    return `about:blank#deviceId=${deviceId}`;
  }

  const url = new URL(appConfig.displayUrl);
  url.searchParams.set('deviceId', deviceId);
  if (station) {
    url.searchParams.set('station', station);
  } else if (appConfig.stationHint) {
    url.searchParams.set('stationHint', appConfig.stationHint);
  }
  return url.toString();
};

export const pushDeviceInfoToFrame = (
  iframe: HTMLIFrameElement,
  payload: { deviceId: string; metadata: DeviceMetadata }
) => {
  try {
    const origin = new URL(appConfig.displayUrl).origin;
    iframe.contentWindow?.postMessage({ type: 'kds/device-info', payload }, origin === 'null' ? '*' : origin);
  } catch {
    iframe.contentWindow?.postMessage({ type: 'kds/device-info', payload }, '*');
  }
};

export const listenForInfoRequests = (handler: (origin: string) => void) => {
  const listener = (event: MessageEvent) => {
    if (event.data?.type === 'kds/request-device-info') {
      handler(event.origin);
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
};

export const reloadWebView = () => {
  if (window.kdsBridge?.watchdog?.reloadWebContents) {
    window.kdsBridge.watchdog.reloadWebContents();
    return;
  }
  window.location.reload();
};

export const isElectron = () => Capacitor.getPlatform() === 'electron';
