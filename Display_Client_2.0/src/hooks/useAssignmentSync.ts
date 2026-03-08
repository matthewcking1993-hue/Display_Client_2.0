import { useEffect } from 'react';
import { appConfig, serverIdentity } from '../config';
import { getDeviceStatus } from '../services/apiClient';
import { applyDeviceStatusSnapshot } from '../services/assignmentCoordinator';
import { logError } from '../services/logService';
import { useDeviceStore } from '../state/deviceStore';

export const useAssignmentSync = () => {
  const { deviceId, serverKey } = useDeviceStore();

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    const sync = async () => {
      try {
        const snapshot = await getDeviceStatus(deviceId);
        if (!cancelled) {
          await applyDeviceStatusSnapshot(snapshot, serverKey ?? serverIdentity.key);
        }
      } catch (error) {
        logError('Assignment sync failed', { message: (error as Error).message });
      }
    };

    sync();
    const interval = setInterval(sync, Math.max(appConfig.heartbeatIntervalMs, 10000));

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deviceId, serverKey]);
};
