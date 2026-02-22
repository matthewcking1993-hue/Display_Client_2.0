import { useEffect } from 'react';
import { useDeviceStore } from '../state/deviceStore';
import { appConfig } from '../config';
import { reloadWebView } from '../services/deviceBridge';
import { logWarn } from '../services/logService';

export const useWatchdogTimer = () => {
  const { lastHeartbeatAt } = useDeviceStore();

  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastHeartbeatAt) return;
      const delta = Date.now() - new Date(lastHeartbeatAt).getTime();
      if (delta > appConfig.heartbeatIntervalMs * 3) {
        logWarn('Watchdog reload triggered', { delta });
        reloadWebView();
      }
    }, appConfig.heartbeatIntervalMs);

    return () => clearInterval(timer);
  }, [lastHeartbeatAt]);
};
