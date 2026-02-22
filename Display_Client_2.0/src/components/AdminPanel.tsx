import { useEffect, useMemo, useState } from 'react';
import { appConfig } from '../config';
import { useDeviceStore } from '../state/deviceStore';
import { useLogStore } from '../state/logStore';
import { exportLogs, logInfo } from '../services/logService';
import { writeStationAssignment } from '../services/secureStore';

const formatTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

export const AdminPanel = () => {
  const { deviceId, metadata, stationAssignment, lastHeartbeatAt, lastRegistrationAt, setStation } =
    useDeviceStore();
  const [pin, setPin] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isVisible, setVisible] = useState(false);
  const [stationDraft, setStationDraft] = useState(stationAssignment ?? '');
  const { logs } = useLogStore();

  useEffect(() => {
    setStationDraft(stationAssignment ?? '');
  }, [stationAssignment]);

  const diagnostics = useMemo(
    () => [
      { label: 'Device ID', value: deviceId ?? 'pending…' },
      { label: 'Station', value: stationAssignment ?? 'Unassigned' },
      { label: 'Last heartbeat', value: formatTime(lastHeartbeatAt) },
      { label: 'Registered', value: formatTime(lastRegistrationAt) },
      { label: 'App', value: metadata?.appVersion ?? 'n/a' },
      { label: 'Platform', value: `${metadata?.platform ?? 'n/a'} ${metadata?.osVersion ?? ''}`.trim() }
    ],
    [deviceId, stationAssignment, lastHeartbeatAt, lastRegistrationAt, metadata]
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

  const handleStationSave = async () => {
    const sanitized = stationDraft.trim();
    await writeStationAssignment(sanitized || null);
    setStation(sanitized || null);
    logInfo('Station updated', { value: sanitized || null });
  };

  if (!isVisible) {
    return (
      <>
        <button className="admin-pin" onClick={() => setModalVisible(true)} aria-label="Admin login" />
        {isModalVisible && (
          <div className="admin-modal">
            <div className="admin-card">
              <h2>Admin PIN</h2>
              <input
                autoFocus
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && unlock()}
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
        <input value={stationDraft} onChange={(event) => setStationDraft(event.target.value)} />
        <button onClick={handleStationSave}>Save</button>
      </section>

      <section>
        <h3>Logs</h3>
        <p>{logs.length} entries</p>
        <button onClick={() => exportLogs()}>Export JSON</button>
      </section>
    </div>
  );
};
