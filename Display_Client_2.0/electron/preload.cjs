const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kdsBridge', {
  storage: {
    readDeviceId: () => ipcRenderer.invoke('storage:readDeviceId'),
    writeDeviceId: (deviceId) => ipcRenderer.invoke('storage:writeDeviceId', deviceId),
    readStationAssignment: () => ipcRenderer.invoke('storage:readStation'),
    writeStationAssignment: (station) => ipcRenderer.invoke('storage:writeStation', station)
  },
  device: {
    getMetadata: () => ipcRenderer.invoke('device:getMetadata'),
    toggleAutostart: (enabled) => ipcRenderer.invoke('device:autostart', enabled)
  },
  logging: {
    exportLogs: (payload, suggestedName) => ipcRenderer.invoke('logging:export', payload, suggestedName)
  },
  watchdog: {
    reloadWebContents: () => ipcRenderer.invoke('watchdog:reload')
  }
});
