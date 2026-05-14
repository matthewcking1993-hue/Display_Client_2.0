import { useEffect, useMemo, useRef, useState } from 'react';
import { appConfig, getActiveServerIdentity } from '../config';
import { useDeviceStore } from '../state/deviceStore';
import { useLogStore } from '../state/logStore';
import { exportLogs, logError, logInfo } from '../services/logService';
import { clearServerBinding } from '../services/secureStore';
import { releaseStation } from '../services/apiClient';

const formatTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

export const AdminPanel = () => {
  const {
    deviceId,
    metadata,
    stationAssignment,
    lastHeartbeatAt,
    lastRegistrationAt,
    setStation,
    setSession,
    location,
    serverKey,
    session
  } = useDeviceStore();
  const { logs } = useLogStore();
  const [pin, setPin] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isVisible, setVisible] = useState(false);
  const [isReleasing, setReleasing] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const diagnostics = useMemo(
    () =>
      [
        { label: 'Device ID', value: deviceId ?? 'pending…' },
        { label: 'Station', value: stationAssignment ?? 'Unassigned' },
        { label: 'Last heartbeat', value: formatTime(lastHeartbeatAt) },
        { label: 'Registered', value: formatTime(lastRegistrationAt) },
        { label: 'App', value: metadata?.appVersion ?? 'n/a' },
        { label: 'Platform', value: `${metadata?.platform ?? 'n/a'} ${metadata?.osVersion ?? ''}`.trim() }
      ].concat(location ? [{ label: 'Kitchen', value: `${location.name} (${location.id})` }] : []),
    [deviceId, stationAssignment, lastHeartbeatAt, lastRegistrationAt, location, metadata]
  );

  const unlock = () => {
    if (pin === appConfig.adminPin) {
      setVisible(true);
      setModalVisible(false);
      setPin('');
      logInfo('Admin panel unlocked');
    } else {
      setPin('');
    }
  };

  useEffect(() => {
    if (!isModalVisible) {
      setKeyboardOffset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const updateOffset = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(Math.min(220, Math.max(0, keyboardHeight)));
    };

    updateOffset();
    viewport.addEventListener('resize', updateOffset);
    viewport.addEventListener('scroll', updateOffset);

    return () => {
      viewport.removeEventListener('resize', updateOffset);
      viewport.removeEventListener('scroll', updateOffset);
    };
  }, [isModalVisible]);

  const handleRelease = async () => {
    if (!deviceId) return;
    setReleasing(true);
    try {
      await releaseStation(deviceId, 'admin-release');
      await clearServerBinding(serverKey ?? getActiveServerIdentity().key);
      setStation(null);
      setSession(null);
      logInfo('Station released via admin panel');
    } catch (error) {
      logError('Station release failed', { message: (error as Error).message });
    } finally {
      setReleasing(false);
    }
  };

  if (!isVisible) {
    return (
      <>
        <button className="admin-pin" onClick={() => setModalVisible(true)} aria-label="Admin login" />
        {isModalVisible && (
          <div className="admin-modal">
            <div className="admin-card" style={{ transform: keyboardOffset ? `translateY(-${keyboardOffset}px)` : undefined }}>
              <h2>Admin PIN</h2>
              <input
                ref={pinInputRef}
                autoFocus
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && unlock()}
                onFocus={() => {
                  setTimeout(() => {
                    pinInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  }, 60);
                }}
              />
              <button onClick={unlock}>Unlock</button>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setPin('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Diagnostics</h2>
        <button onClick={() => setVisible(false)}>Close</button>
      </div>
      <dl>
        {diagnostics.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3>Station Assignment</h3>
        <p>{stationAssignment ?? 'Unassigned'}</p>
        <p className="station-hint">
          Use the on-screen selector to claim a station. Release here to free this device so another display can claim it.
        </p>
        <button onClick={handleRelease} disabled={!stationAssignment || isReleasing}>
          {isReleasing ? 'Releasing…' : 'Release Station'}
        </button>
        {session && (
          <p className="station-hint">
            Session {session.status} • Claimed {session.claimedAt ? new Date(session.claimedAt).toLocaleString() : 'recently'}
          </p>
        )}
      </section>

      <section>
        <h3>Logs</h3>
        <p>{logs.length} entries</p>
        <button onClick={() => exportLogs()}>Export JSON</button>
      </section>
    </div>
  );
};
