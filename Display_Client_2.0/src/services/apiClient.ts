import axios from 'axios';
import { appConfig } from '../config';
import type {
  DeviceMetadata,
  RegistrationPayload,
  DeviceStatusResponse,
  StationAvailabilityResponse,
} from '../types/device';
import { logError, logInfo } from './logService';

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 8000
});

export const setApiBaseUrl = (baseUrl: string) => {
  api.defaults.baseURL = baseUrl;
};

export const getApiBaseUrl = () => {
  const baseUrl = api.defaults.baseURL;
  return typeof baseUrl === 'string' ? baseUrl : '';
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError('API error', { message: error.message, url: error.config?.url });
    return Promise.reject(error);
  }
);

export const registerDevice = async (payload: RegistrationPayload) => {
  if (!getApiBaseUrl()) {
    logInfo('Skipping registration: API base URL is not configured');
    return null;
  }
  const response = await api.post('/api/devices/register', payload, {
    headers: {
      'X-KDS-Device-ID': payload.deviceId
    }
  });
  logInfo('Device registration response', { status: response.status });
  return response.data;
};

export const sendHeartbeat = async (deviceId: string, metadata: DeviceMetadata) => {
  if (!getApiBaseUrl()) return;
  const response = await api.post(
    '/api/devices/heartbeat',
    {
      deviceId,
      screen: metadata.screen
    },
    {
      headers: {
        'X-KDS-Device-ID': deviceId
      }
    }
  );
  return response.data;
};

export const getDeviceStatus = async (deviceId: string): Promise<DeviceStatusResponse | null> => {
  if (!getApiBaseUrl()) {
    return null;
  }
  const response = await api.get(`/api/devices/${encodeURIComponent(deviceId)}/status`, {
    headers: {
      'X-KDS-Device-ID': deviceId
    }
  });
  return response.data;
};

export const fetchStationAvailability = async (): Promise<StationAvailabilityResponse | null> => {
  if (!getApiBaseUrl()) {
    return null;
  }
  const response = await api.get('/api/devices/stations/availability');
  return response.data;
};

export const claimStation = async (
  deviceId: string,
  stationId: string,
  metadata: DeviceMetadata
): Promise<DeviceStatusResponse> => {
  const response = await api.post(
    `/api/devices/${encodeURIComponent(deviceId)}/claim`,
    {
      stationId,
      metadata,
    },
    {
      headers: {
        'X-KDS-Device-ID': deviceId,
      },
    }
  );
  return response.data;
};

export const releaseStation = async (deviceId: string, reason = 'manual-release') => {
  const response = await api.post(
    `/api/devices/${encodeURIComponent(deviceId)}/release`,
    { reason },
    {
      headers: {
        'X-KDS-Device-ID': deviceId,
      },
    }
  );
  return response.data;
};
