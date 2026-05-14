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

export interface DeviceSessionSummary {
  stationId: string;
  deviceId: string;
  status: string;
  claimedAt?: string | null;
  lastHeartbeat?: string | null;
  releasedAt?: string | null;
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
  session?: DeviceSessionSummary | null;
}

export interface StationAvailability {
  stationId: string;
  stationName: string;
  displayType?: string;
  isAvailable: boolean;
  activeDeviceId?: string | null;
  claimedAt?: string | null;
  lastHeartbeat?: string | null;
}

export interface StationAvailabilityResponse {
  total: number;
  stations: StationAvailability[];
}

export interface BootstrapServerDescriptor {
  origin: string;
  apiBaseUrl: string;
  displayBaseUrl: string;
  remotePort: number;
  devicePort: number;
}

export interface BootstrapResolveResponse {
  discoveredAt: string;
  leaseTtlSeconds: number;
  location?: LocationInfo | null;
  server: BootstrapServerDescriptor;
  stationAvailability?: StationAvailabilityResponse;
  device?: {
    deviceId: string;
    registration?: Record<string, unknown> | null;
    assignment?: Record<string, unknown> | null;
  };
}

export interface BootstrapResolveRequest {
  deviceId: string;
  metadata: DeviceMetadata;
  stationHint?: string;
  currentOrigin?: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
  context?: Record<string, unknown>;
}
