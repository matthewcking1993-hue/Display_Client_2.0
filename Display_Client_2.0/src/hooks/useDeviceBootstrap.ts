import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDeviceStore } from '../state/deviceStore';
import { collectDeviceMetadata } from '../services/deviceBridge';
import { logError, logInfo } from '../services/logService';
import { readDeviceId, writeDeviceId, readServerBinding } from '../services/secureStore';
import { getDeviceStatus, registerDevice, setApiBaseUrl } from '../services/apiClient';
import { appConfig, getActiveServerIdentity, setRuntimeServerOrigin, testingFallback } from '../config';
import { applyDeviceStatusSnapshot } from '../services/assignmentCoordinator';

const BOOTSTRAP_RETRY_WINDOW_MS = 30000;
const BOOTSTRAP_RETRY_INTERVAL_MS = 3000;

const delay = (timeoutMs: number) => new Promise((resolve) => setTimeout(resolve, timeoutMs));

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

  const loadBinding = useCallback(async (serverKey: string) => {
    const binding = await readServerBinding(serverKey);
    setStation(binding?.stationId ?? null);
    setDisplayPath(binding?.displayPath ?? null);
  }, [setDisplayPath, setStation]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setBootstrapState('pending');
      try {
        setApiBaseUrl(appConfig.apiBaseUrl);

        const baseIdentity = getActiveServerIdentity();
        setServerKey(baseIdentity.key);
        await loadBinding(baseIdentity.key);

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

        const registerAndSync = async (serverKey: string) => {
          await registerDevice({
            deviceId: persisted,
            metadata: metadataPayload,
            stationHint: appConfig.stationHint
          });
          markRegistration(new Date().toISOString());

          const status = await getDeviceStatus(persisted);
          await applyDeviceStatusSnapshot(status, serverKey);
        };

        const bootstrapStartedAt = Date.now();
        let lastError: Error | null = null;

        while (Date.now() - bootstrapStartedAt < BOOTSTRAP_RETRY_WINDOW_MS) {
          try {
            const activeIdentity = getActiveServerIdentity();
            setServerKey(activeIdentity.key);
            await registerAndSync(activeIdentity.key);
            setBootstrapState('ready');
            return;
          } catch (attemptError) {
            lastError = attemptError as Error;
            logError('Bootstrap attempt failed', {
              message: lastError.message,
              elapsedMs: Date.now() - bootstrapStartedAt
            });
            await delay(BOOTSTRAP_RETRY_INTERVAL_MS);
          }
        }

        try {
          const fallbackIdentity = setRuntimeServerOrigin(testingFallback.origin);
          setApiBaseUrl(appConfig.apiBaseUrl);
          setServerKey(fallbackIdentity.key);
          await loadBinding(fallbackIdentity.key);
          logInfo('Primary bootstrap timed out, switching to fallback origin', {
            origin: testingFallback.origin
          });
          await registerAndSync(fallbackIdentity.key);
          setBootstrapState('ready');
          return;
        } catch (fallbackError) {
          lastError = fallbackError as Error;
          logError('Fallback bootstrap failed', {
            message: lastError.message,
            origin: testingFallback.origin
          });
        }

        throw lastError ?? new Error('Bootstrap failed after retry window and fallback');
      } catch (error) {
        logError('Bootstrap failed', { message: (error as Error).message });
        setBootstrapState('error');
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [
    loadBinding,
    markRegistration,
    setBootstrapState,
    setDeviceId,
    setMetadata,
    setServerKey
  ]);

  return {
    deviceId,
    metadata,
    refreshStation: loadBinding
  };
};
