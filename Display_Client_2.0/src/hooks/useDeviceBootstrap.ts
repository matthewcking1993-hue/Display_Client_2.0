import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDeviceStore } from '../state/deviceStore';
import { collectDeviceMetadata } from '../services/deviceBridge';
import { logError, logInfo } from '../services/logService';
import { readDeviceId, writeDeviceId, readServerBinding } from '../services/secureStore';
import { getDeviceStatus, registerDevice } from '../services/apiClient';
import { appConfig, serverIdentity } from '../config';
import { applyDeviceStatusSnapshot } from '../services/assignmentCoordinator';

export const useDeviceBootstrap = () => {
  const {
    setDeviceId,
    setBootstrapState,
    setMetadata,
    setStation,
    markRegistration,
     setDisplayPath,
     setServerKey,
    deviceId,
    metadata
  } = useDeviceStore();

  const loadBinding = useCallback(async () => {
    const binding = await readServerBinding(serverIdentity.key);
    if (binding?.stationId) {
      setStation(binding.stationId);
    }
    if (binding?.displayPath) {
      setDisplayPath(binding.displayPath);
    }
  }, [setDisplayPath, setStation]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setBootstrapState('pending');
      try {
        setServerKey(serverIdentity.key);
        await loadBinding();

        let persisted = await readDeviceId();
        if (!persisted) {
          persisted = uuidv4();
          await writeDeviceId(persisted);
          logInfo('Generated new device UUID', { value: persisted });
        }
        if (!mounted) return;
        setDeviceId(persisted);

        const metadataPayload = await collectDeviceMetadata();
        if (!mounted) return;
        setMetadata(metadataPayload);

        await registerDevice({
          deviceId: persisted,
          metadata: metadataPayload,
          stationHint: appConfig.stationHint
        });
        markRegistration(new Date().toISOString());

        const status = await getDeviceStatus(persisted);
        await applyDeviceStatusSnapshot(status, serverIdentity.key);

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
  }, [loadBinding, markRegistration, setBootstrapState, setDeviceId, setMetadata, setServerKey]);

  return {
    deviceId,
    metadata,
    refreshStation: loadBinding
  };
};
