// Copyright (C) 2024-2025 Murilo Gomes Julio
// SPDX-License-Identifier: GPL-2.0-only

// Mestre da Info
// Site: https://www.mestredainfo.com.br

const { contextBridge, ipcRenderer } = require('electron')

ipcRenderer.setMaxListeners(20);

contextBridge.exposeInMainWorld('miremovependrive', {
    version: (type) => ipcRenderer.invoke('appVersao', type),
    newWindow: (url, width, height, resizable, frame, menu, hide) => ipcRenderer.invoke('appNewWindow', url, width, height, resizable, frame, menu, hide),
    openURL: (url) => ipcRenderer.invoke('appExterno', url),
    translate: (text, ...values) => ipcRenderer.invoke('appTraduzir', text, ...values),
    readFile: (filename) => ipcRenderer.invoke('appReadFile', filename),
    getUSB: () => ipcRenderer.invoke('appGetUSB'),
    listUSB: (listener) => ipcRenderer.on('list:usb', (event, ...args) => listener(...args) + ipcRenderer.removeListener('list:usb')),
    removeUSB: (c) => ipcRenderer.invoke('appRemoveUSB', c),
    listRemoveUSB: (listener) => ipcRenderer.on('driver:msg', (event, ...args) => listener(...args) + ipcRenderer.removeListener('driver:msg')),
    infoUSB: (c) => ipcRenderer.invoke('appInfoUSB', c),
    listInfoUSB: (listener) => ipcRenderer.on('driver:info', (event, ...args) => listener(...args) + ipcRenderer.removeListener('driver:info')),
});