import { useEffect, useMemo, useRef, useState } from 'react';
import { buildDisplayUrl, listenForInfoRequests, pushDeviceInfoToFrame } from '../services/deviceBridge';
import { useDeviceStore } from '../state/deviceStore';
import { logInfo } from '../services/logService';

interface Props {
  reloadToken: number;
}

export const DisplaySurface = ({ reloadToken }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { deviceId, metadata, stationAssignment } = useDeviceStore();
  const [isLoaded, setLoaded] = useState(false);

  const src = useMemo(() => {
    if (!deviceId) return undefined;
    return buildDisplayUrl(deviceId, stationAssignment);
  }, [deviceId, stationAssignment, reloadToken]);

  useEffect(() => {
    if (!deviceId || !metadata || !iframeRef.current) return;
    const frame = iframeRef.current;

    const emit = () => {
      pushDeviceInfoToFrame(frame, { deviceId, metadata });
      logInfo('Sent device info to embedded display');
    };

    const timer = setTimeout(emit, 750);
    const remove = listenForInfoRequests(() => emit());

    return () => {
      clearTimeout(timer);
      remove();
    };
  }, [deviceId, metadata, reloadToken]);

  return (
    <div className="display-surface">
      {src && (
        <iframe
          key={reloadToken}
          ref={iframeRef}
          src={src}
          title="KDS Display"
          onLoad={() => setLoaded(true)}
          allow="clipboard-read; clipboard-write; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
        />
      )}
      {!isLoaded && <div className="display-surface__loading">Connecting to kitchen display…</div>}
    </div>
  );
};
