import { useEffect, useMemo } from 'react';
import { DisplaySurface } from './components/DisplaySurface';
import { AdminPanel } from './components/AdminPanel';
import { StationAssignmentModal } from './components/StationAssignmentModal';
import { useDeviceBootstrap } from './hooks/useDeviceBootstrap';
import { useHeartbeat } from './hooks/useHeartbeat';
import { useKioskGuards } from './hooks/useKioskGuards';
import { useAssignmentSync } from './hooks/useAssignmentSync';
import { useNetworkWatchdog } from './hooks/useNetworkWatchdog';
import { useWatchdogTimer } from './hooks/useWatchdogTimer';
import { useDeviceStore } from './state/deviceStore';
import { logError, logInfo } from './services/logService';
import { appConfig, setRuntimeServerOrigin } from './config';
import { discoverBootstrapServer } from './services/bootstrapDiscovery';
import { getDeviceStatus, registerDevice, setApiBaseUrl } from './services/apiClient';
import { applyDeviceStatusSnapshot } from './services/assignmentCoordinator';
import { releaseStation } from './services/apiClient';
import { clearServerBinding } from './services/secureStore';

const App = () => {
  const {
    bootstrapState,
    isOnline,
    deviceId,
    metadata,
    serverKey,
    markRegistration,
    setServerKey,
    setBootstrapState,
  } = useDeviceStore();

  useDeviceBootstrap();
  useHeartbeat();
  useKioskGuards();
  useAssignmentSync();
  useWatchdogTimer();
  useNetworkWatchdog(async () => {
    logInfo('Network reconnected - attempting bootstrap resolution');

    if (!deviceId || !metadata) {
      return;
    }

    try {
      const resolved = await discoverBootstrapServer({
        deviceId,
        metadata,
        stationHint: appConfig.stationHint,
      });

      if (!resolved?.server?.origin) {
        logInfo('Network reconnected - no bootstrap resolution change');
        return;
      }

      const identity = setRuntimeServerOrigin(resolved.server.origin);
      setApiBaseUrl(appConfig.apiBaseUrl);
      setServerKey(identity.key);

      await registerDevice({
        deviceId,
        metadata,
        stationHint: appConfig.stationHint,
      });
      markRegistration(new Date().toISOString());

      const snapshot = await getDeviceStatus(deviceId);
      await applyDeviceStatusSnapshot(snapshot, identity.key);
      setBootstrapState('ready');

      logInfo('Network reconnect bootstrap succeeded', {
        origin: resolved.server.origin,
        locationId: resolved.location?.id,
      });
    } catch (error) {
      logError('Network reconnect bootstrap failed', {
        message: (error as Error).message,
      });
    }
  });

  const status = useMemo(() => {
    switch (bootstrapState) {
      case 'pending':
        return 'Preparing device…';
      case 'error':
        return 'Bootstrap failed — connect a local server to continue.';
      default:
        return null;
    }
  }, [bootstrapState]);

  useEffect(() => {
    const cleanup = async () => {
      if (!serverKey) {
        return;
      }

      await clearServerBinding(serverKey);
      if (deviceId) {
        await releaseStation(deviceId, 'app-session-ended');
      }
    };

    const handleUnload = () => {
      cleanup().catch((error) => {
        logError('Failed to dispose assignment on close', {
          message: (error as Error).message,
        });
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [deviceId, serverKey]);

  return (
    <div className="app-shell">
      <DisplaySurface />
      <AdminPanel />
      <StationAssignmentModal />
      {status && <div className="status-banner">{status}</div>}
      {!isOnline && <div className="status-banner warning">Offline — attempting to recover…</div>}
    </div>
  );
};

export default App;
