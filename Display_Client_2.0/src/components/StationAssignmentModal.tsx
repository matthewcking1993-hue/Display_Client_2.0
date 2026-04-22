import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchStationAvailability,
  claimStation,
  getDeviceStatus,
  registerDevice,
  setApiBaseUrl,
} from '../services/apiClient';
import { useDeviceStore } from '../state/deviceStore';
import { logError, logInfo } from '../services/logService';
import { applyDeviceStatusSnapshot } from '../services/assignmentCoordinator';
import {
  appConfig,
  getActiveServerIdentity,
  setRuntimeServerOrigin,
  testingFallback,
} from '../config';
import type { StationAvailability } from '../types/device';

export const StationAssignmentModal = () => {
  const {
    deviceId,
    metadata,
    stationAssignment,
    bootstrapState,
    session,
    markRegistration,
    setServerKey,
    setBootstrapState,
  } = useDeviceStore();
  const [stations, setStations] = useState<StationAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localServerInput, setLocalServerInput] = useState(
    () => getActiveServerIdentity().origin || testingFallback.origin
  );
  const [activeServerLabel, setActiveServerLabel] = useState(() => getActiveServerIdentity().origin || 'Unconfigured');

  const recoveryMode = bootstrapState === 'error';
  const needsAssignment = useMemo(
    () => Boolean(deviceId) && (recoveryMode || (bootstrapState === 'ready' && (!stationAssignment || !session))),
    [bootstrapState, deviceId, recoveryMode, stationAssignment, session]
  );

  const connectAndSync = useCallback(
    async (origin: string) => {
      if (!deviceId || !metadata) {
        return;
      }

      const identity = setRuntimeServerOrigin(origin);
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
      setActiveServerLabel(identity.origin || origin);
    },
    [deviceId, markRegistration, metadata, setBootstrapState, setServerKey]
  );

  const loadStations = useCallback(async () => {
    if (!needsAssignment) return;
    setLoading(true);
    try {
      const response = await fetchStationAvailability();
      setStations(response?.stations ?? []);
      setError(null);
    } catch (loadError) {
      const message = (loadError as Error).message || 'Unable to load stations';
      setError(message);
      logError('Station availability fetch failed', { message });
    } finally {
      setLoading(false);
    }
  }, [needsAssignment]);

  useEffect(() => {
    if (needsAssignment) {
      loadStations();
    }
  }, [loadStations, needsAssignment]);

  const handleClaim = async (stationId: string) => {
    if (!deviceId || !metadata) return;
    setSubmitting(stationId);
    try {
      const snapshot = await claimStation(deviceId, stationId, metadata);
      const activeIdentity = getActiveServerIdentity();
      await applyDeviceStatusSnapshot(snapshot, activeIdentity.key);
      logInfo('Station claimed from modal', { stationId });
      setError(null);
    } catch (claimError) {
      const message = (claimError as Error).message || 'Unable to claim station';
      setError(message);
      logError('Station claim failed', { message, stationId });
      await loadStations();
    } finally {
      setSubmitting(null);
    }
  };

  const handleConnectLocal = async () => {
    setConnecting(true);
    try {
      await connectAndSync(localServerInput);
      await loadStations();
      setError(null);
      logInfo('Connected to local server from recovery modal', { origin: localServerInput });
    } catch (connectError) {
      const message = (connectError as Error).message || 'Unable to connect local server';
      setError(message);
      logError('Local server connect failed', { message, origin: localServerInput });
    } finally {
      setConnecting(false);
    }
  };

  if (!needsAssignment) {
    return null;
  }

  const hasAvailable = stations.some((station) => station.isAvailable);

  return (
    <div className="station-modal">
      <div className="station-card">
        <header>
          <div>
            <p className="eyebrow">Select a station</p>
            <h2>Claim this display</h2>
          </div>
          <button type="button" onClick={loadStations} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh' }
          </button>
        </header>
        <p className="station-card__hint">
          Pick any station that is not currently active. When you choose one, this device begins streaming that station’s display.
        </p>
        <div className="station-card__server">
          <label htmlFor="local-server-input">Server origin</label>
          <div className="station-card__server-controls">
            <input
              id="local-server-input"
              type="text"
              value={localServerInput}
              placeholder="http://10.0.2.2:32768"
              onChange={(event) => setLocalServerInput(event.target.value)}
              disabled={connecting || submitting !== null}
            />
            <button type="button" onClick={handleConnectLocal} disabled={connecting || submitting !== null}>
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          </div>
          <p>Active server: {activeServerLabel}</p>
          {recoveryMode && (
            <p>
              Bootstrap timed out. Connect to a reachable local server, refresh stations, then claim one.
            </p>
          )}
        </div>
        {error && <div className="station-card__error">{error}</div>}
        <div className="station-list">
          {stations.map((station) => {
            const label = station.stationName || station.stationId;
            const isBusy = !station.isAvailable;
            const isSubmittingStation = submitting === station.stationId;
            return (
              <button
                key={station.stationId}
                type="button"
                className={`station-pill ${isBusy ? 'busy' : ''}`}
                disabled={isBusy || isSubmittingStation}
                onClick={() => handleClaim(station.stationId)}
              >
                <div>
                  <span>{label}</span>
                  <small>{station.displayType?.toUpperCase()}</small>
                </div>
                <span className="station-pill__status">
                  {isSubmittingStation && 'Claiming…'}
                  {!isSubmittingStation && (isBusy ? 'In use' : 'Available')}
                </span>
              </button>
            );
          })}
          {!stations.length && !loading && (
            <div className="station-card__empty">No stations configured in the kitchen model.</div>
          )}
          {stations.length > 0 && !hasAvailable && (
            <div className="station-card__empty">
              All stations are currently active. Release one from the manager to reclaim it here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
