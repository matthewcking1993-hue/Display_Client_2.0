import axios from 'axios';
import { appConfig } from '../config';
import type { DeviceMetadata, RegistrationPayload } from '../types/device';
import { logError, logInfo } from './logService';

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 8000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError('API error', { message: error.message, url: error.config?.url });
    return Promise.reject(error);
  }
);

export const registerDevice = async (payload: RegistrationPayload) => {
  if (!appConfig.apiBaseUrl) {
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
  if (!appConfig.apiBaseUrl) return;
  await api.post(
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
};
