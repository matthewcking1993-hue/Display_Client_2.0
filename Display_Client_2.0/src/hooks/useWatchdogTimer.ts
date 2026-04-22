import { useEffect } from 'react';
import { useDeviceStore } from '../state/deviceStore';
import { appConfig } from '../config';
import { logWarn } from '../services/logService';

export const useWatchdogTimer = () => {
  const { lastHeartbeatAt } = useDeviceStore();

  useEffect(() => {
    let lastLoggedBucket = -1;

    const timer = setInterval(() => {
      if (!lastHeartbeatAt) return;
      const delta = Date.now() - new Date(lastHeartbeatAt).getTime();
      if (delta > appConfig.heartbeatIntervalMs * 3) {
        const minuteBucket = Math.floor(delta / 60000);
        if (minuteBucket !== lastLoggedBucket) {
          lastLoggedBucket = minuteBucket;
          logWarn('Heartbeat is stale; retaining active session without hard reload', { delta });
        }
      }
    }, appConfig.heartbeatIntervalMs);

    return () => clearInterval(timer);
  }, [lastHeartbeatAt]);
};
