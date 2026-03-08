import { useDeviceStore } from '../state/deviceStore';
import type { DeviceStatusResponse } from '../types/device';
import { writeServerBinding } from './secureStore';
import { logInfo } from './logService';

export const applyDeviceStatusSnapshot = async (
  status: DeviceStatusResponse | null,
  serverKey: string
) => {
  if (!status) {
    return;
  }

  const { setStation, setDisplayPath, setLocation } = useDeviceStore.getState();
  const nextStation = status.assignment?.stationId ?? null;
  const nextPath = status.display?.path ?? null;

  setLocation(status.location ?? null);
  setStation(nextStation);
  setDisplayPath(nextPath);

  await writeServerBinding(serverKey, {
    stationId: nextStation,
    displayPath: nextPath,
    locationId: status.location?.id ?? null
  });

  logInfo('Device assignment snapshot applied', {
    station: nextStation,
    displayPath: nextPath,
    location: status.location?.id
  });
};
