import { create } from 'zustand';
import type { DeviceMetadata } from '../types/device';

type BootstrapPhase = 'idle' | 'pending' | 'ready' | 'error';

interface DeviceState {
  deviceId: string | null;
  metadata: DeviceMetadata | null;
  stationAssignment: string | null;
  bootstrapState: BootstrapPhase;
  lastHeartbeatAt?: string;
  lastRegistrationAt?: string;
  isOnline: boolean;
  setDeviceId: (deviceId: string) => void;
  setMetadata: (metadata: DeviceMetadata) => void;
  setStation: (station: string | null) => void;
  setBootstrapState: (state: BootstrapPhase) => void;
  markHeartbeat: (timestamp: string) => void;
  markRegistration: (timestamp: string) => void;
  setOnline: (online: boolean) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceId: null,
  metadata: null,
  stationAssignment: null,
  bootstrapState: 'idle',
  isOnline: true,
  setDeviceId: (deviceId) => set({ deviceId }),
  setMetadata: (metadata) => set({ metadata }),
  setStation: (stationAssignment) => set({ stationAssignment }),
  setBootstrapState: (bootstrapState) => set({ bootstrapState }),
  markHeartbeat: (timestamp) => set({ lastHeartbeatAt: timestamp }),
  markRegistration: (timestamp) => set({ lastRegistrationAt: timestamp }),
  setOnline: (isOnline) => set({ isOnline })
}));
