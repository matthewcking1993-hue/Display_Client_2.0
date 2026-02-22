import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDeviceStore } from '../state/deviceStore';
import { collectDeviceMetadata } from '../services/deviceBridge';
import { logError, logInfo } from '../services/logService';
import { readDeviceId, writeDeviceId, readStationAssignment } from '../services/secureStore';
import { registerDevice } from '../services/apiClient';
import { appConfig } from '../config';

export const useDeviceBootstrap = () => {
  const {
    setDeviceId,
    setBootstrapState,
    setMetadata,
    setStation,
    markRegistration,
    deviceId,
    metadata
  } = useDeviceStore();

  const loadStation = useCallback(async () => {
    const stored = await readStationAssignment();
    if (stored) setStation(stored);
  }, [setStation]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setBootstrapState('pending');
      try {
        let persisted = await readDeviceId();
        if (!persisted) {
          persisted = uuidv4();
          await writeDeviceId(persisted);
          logInfo('Generated new device UUID', { value: persisted });
        }
        if (!mounted) return;
        setDeviceId(persisted);

        await loadStation();

        const metadataPayload = await collectDeviceMetadata();
        if (!mounted) return;
        setMetadata(metadataPayload);

        await registerDevice({
          deviceId: persisted,
          metadata: metadataPayload,
          stationHint: appConfig.stationHint
        });
        markRegistration(new Date().toISOString());

        setBootstrapState('ready');
      } catch (error) {
        logError('Bootstrap failed', { message: (error as Error).message });
        setBootstrapState('error');
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadStation, markRegistration, setBootstrapState, setDeviceId, setMetadata]);

  return {
    deviceId,
    metadata,
    refreshStation: loadStation
  };
};
