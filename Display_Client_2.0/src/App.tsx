import { useMemo } from 'react';
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
import { logInfo } from './services/logService';

const App = () => {
  const { bootstrapState, isOnline } = useDeviceStore();

  useDeviceBootstrap();
  useHeartbeat();
  useKioskGuards();
  useAssignmentSync();
  useWatchdogTimer();
  useNetworkWatchdog(() => {
    logInfo('Network reconnected - keeping active display session');
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
