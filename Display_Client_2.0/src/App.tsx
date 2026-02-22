import { useMemo, useState } from 'react';
import { DisplaySurface } from './components/DisplaySurface';
import { AdminPanel } from './components/AdminPanel';
import { useDeviceBootstrap } from './hooks/useDeviceBootstrap';
import { useHeartbeat } from './hooks/useHeartbeat';
import { useKioskGuards } from './hooks/useKioskGuards';
import { useNetworkWatchdog } from './hooks/useNetworkWatchdog';
import { useWatchdogTimer } from './hooks/useWatchdogTimer';
import { useDeviceStore } from './state/deviceStore';
import { logInfo } from './services/logService';

const App = () => {
  const { bootstrapState, isOnline } = useDeviceStore();
  const [reloadToken, setReloadToken] = useState(0);

  useDeviceBootstrap();
  useHeartbeat();
  useKioskGuards();
  useWatchdogTimer();
  useNetworkWatchdog(() => {
    setReloadToken((value) => value + 1);
    logInfo('Reload triggered after reconnect');
  });

  const status = useMemo(() => {
    switch (bootstrapState) {
      case 'pending':
        return 'Preparing device…';
      case 'error':
        return 'Bootstrap failed — check admin panel.';
      default:
        return null;
    }
  }, [bootstrapState]);

  return (
    <div className="app-shell">
      <DisplaySurface reloadToken={reloadToken} />
      <AdminPanel />
      {status && <div className="status-banner">{status}</div>}
      {!isOnline && <div className="status-banner warning">Offline — attempting to recover…</div>}
    </div>
  );
};

export default App;
