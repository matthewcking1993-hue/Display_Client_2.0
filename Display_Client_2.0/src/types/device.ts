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

export interface LocationInfo {
  id: string;
  name: string;
}

export interface DeviceAssignmentSummary {
  stationId: string;
  stationName?: string | null;
  assignedAt?: string | null;
  assignedBy?: string | null;
  displaySlug?: string | null;
  deviceType?: string | null;
}

export interface DisplayDescriptor {
  baseUrl: string;
  path: string;
  slug: string | null;
  url: string;
  stationId: string | null;
}

export interface DeviceStatusResponse {
  deviceId: string;
  registered: boolean;
  location?: LocationInfo | null;
  registration?: Record<string, unknown> | null;
  assignment?: DeviceAssignmentSummary | null;
  display?: DisplayDescriptor | null;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
  context?: Record<string, unknown>;
}
