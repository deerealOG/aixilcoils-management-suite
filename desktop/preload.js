/**
 * AIXILCOILS Management Suite - Electron Preload Script
 * 
 * This script runs in the renderer process before the web page loads.
 * It provides a secure bridge between the main process and web content.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  platform: process.platform,
  
  // Notifications
  showNotification: (title, body) => {
    new Notification(title, { body });
  },
  
  // Update events
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  
  // Check if running in Electron
  isElectron: true,
});

// Log when preload script has loaded
console.log('AIXILCOILS AMS Desktop - Preload script loaded');
