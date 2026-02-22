import { useEffect } from 'react';
import { sendHeartbeat } from '../services/apiClient';
import { useDeviceStore } from '../state/deviceStore';
import { appConfig } from '../config';
import { logError, logInfo } from '../services/logService';

export const useHeartbeat = () => {
  const { deviceId, metadata, markHeartbeat } = useDeviceStore();

  useEffect(() => {
    if (!deviceId || !metadata) return;

    const interval = setInterval(async () => {
      try {
        await sendHeartbeat(deviceId, metadata);
        const timestamp = new Date().toISOString();
        markHeartbeat(timestamp);
        logInfo('Heartbeat sent', { timestamp });
      } catch (error) {
        logError('Heartbeat failed', { message: (error as Error).message });
      }
    }, appConfig.heartbeatIntervalMs);

    return () => clearInterval(interval);
  }, [deviceId, markHeartbeat, metadata]);
};
