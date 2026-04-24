import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { useDeviceStore } from '../state/deviceStore';
import { logError, logInfo, logWarn } from '../services/logService';

export const useNetworkWatchdog = (onReconnect?: () => void | Promise<void>) => {
  const { setOnline } = useDeviceStore();

  useEffect(() => {
    let isMounted = true;
    let removeNativeListener: (() => void) | undefined;
    let lastConnected: boolean | null = null;

    const applyOnlineState = (connected: boolean, connectionType = 'unknown') => {
      const transitionedToOnline = lastConnected === false && connected === true;
      lastConnected = connected;
      setOnline(connected);
      if (connected) {
        logInfo('Network restored', { type: connectionType });
        if (transitionedToOnline) {
          Promise.resolve(onReconnect?.()).catch((error) => {
            logError('Reconnect callback failed', {
              message: (error as Error).message,
            });
          });
        }
      } else {
        logWarn('Network lost', { type: connectionType });
      }
    };

    const setupBrowserFallback = () => {
      const onOnline = () => applyOnlineState(true, 'browser');
      const onOffline = () => applyOnlineState(false, 'browser');

      lastConnected = navigator.onLine;
      setOnline(navigator.onLine);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);

      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    };

    const attach = async () => {
      const nativeAvailable = Capacitor.getPlatform() !== 'web' && Capacitor.isPluginAvailable('Network');

      if (!nativeAvailable) {
        return setupBrowserFallback();
      }

      try {
        const status = await Network.getStatus();
        if (!isMounted) return undefined;
        lastConnected = status.connected;
        setOnline(status.connected);

        const listener = await Network.addListener('networkStatusChange', (change) => {
          applyOnlineState(change.connected, change.connectionType);
        });

        return () => {
          listener.remove();
        };
      } catch (error) {
        logWarn('Network plugin unavailable, using browser fallback', {
          message: (error as Error).message,
        });
        return setupBrowserFallback();
      }
    };

    attach().then((removeHandler) => {
      removeNativeListener = removeHandler;
    });

    return () => {
      isMounted = false;
      removeNativeListener?.();
    };
  }, [onReconnect, setOnline]);
};
