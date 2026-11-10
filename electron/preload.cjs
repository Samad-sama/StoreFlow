const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  onMaximizedChange: (callback) => {
    const handler = (_event, isMax) => callback(isMax);
    ipcRenderer.on('window-maximized-change', handler);
    return () => ipcRenderer.removeListener('window-maximized-change', handler);
  },
  printThermalReceipt: (htmlContent) => ipcRenderer.invoke('print-thermal-receipt', htmlContent),
});
