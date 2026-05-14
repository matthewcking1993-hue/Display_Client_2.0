import type { DeviceMetadata } from './device';

interface NativeServerBinding {
  stationId?: string | null;
  displayPath?: string | null;
  locationId?: string | null;
}

declare global {
  const __APP_VERSION__: string;

  interface NativeBridgeStorage {
    readDeviceId(): Promise<string | null>;
    writeDeviceId(deviceId: string): Promise<void>;
    readStationAssignment(): Promise<string | null>;
    writeStationAssignment(station: string | null): Promise<void>;
    readServerBinding?(serverKey: string): Promise<NativeServerBinding | null>;
    writeServerBinding?(serverKey: string, binding: NativeServerBinding): Promise<void>;
  }

  interface NativeBridgeDevice {
    getMetadata(): Promise<DeviceMetadata>;
    toggleAutostart?(enabled: boolean): Promise<void>;
    relaunchApp?(): Promise<void>;
  }

  interface NativeBridgeLogging {
    exportLogs(payload: string, suggestedName: string): Promise<void>;
  }

  interface NativeBridgeWatchdog {
    reloadWebContents(): Promise<void>;
  }

  interface KdsBridge {
    storage?: NativeBridgeStorage;
    device?: NativeBridgeDevice;
    logging?: NativeBridgeLogging;
    watchdog?: NativeBridgeWatchdog;
  }

  interface Window {
    kdsBridge?: KdsBridge;
  }
}

export {};
