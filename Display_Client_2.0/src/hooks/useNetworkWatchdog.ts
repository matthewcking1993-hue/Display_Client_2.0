import { useEffect } from 'react';
import { Network } from '@capacitor/network';
import { useDeviceStore } from '../state/deviceStore';
import { logInfo, logWarn } from '../services/logService';

export const useNetworkWatchdog = (onReconnect?: () => void) => {
  const { setOnline } = useDeviceStore();

  useEffect(() => {
    let isMounted = true;

    const attach = async () => {
      const status = await Network.getStatus();
      if (!isMounted) return;
      setOnline(status.connected);

      const listener = Network.addListener('networkStatusChange', (change) => {
        setOnline(change.connected);
        if (change.connected) {
          logInfo('Network restored', { type: change.connectionType });
          onReconnect?.();
        } else {
          logWarn('Network lost', { type: change.connectionType });
        }
      });

      return listener;
    };

    let remove: { remove: () => void } | undefined;
    attach().then((listener) => {
      remove = listener;
    });

    return () => {
      isMounted = false;
      remove?.remove();
    };
  }, [onReconnect, setOnline]);
};
