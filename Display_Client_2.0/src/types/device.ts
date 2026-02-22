export interface DeviceMetadata {
  platform: string;
  osVersion: string;
  model: string;
  manufacturer?: string;
  isVirtual?: boolean;
  screen: {
    width: number;
    height: number;
    density: number;
    orientation: string;
    touchSupport: boolean;
  };
  appVersion: string;
}

export interface RegistrationPayload {
  deviceId: string;
  metadata: DeviceMetadata;
  stationHint?: string;
}

export interface DeviceStatus {
  isOnline: boolean;
  lastHeartbeat?: string;
  lastRegistration?: string;
  stationAssignment?: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
  context?: Record<string, unknown>;
}
