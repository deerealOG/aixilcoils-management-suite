/**
 * Platform Detection Utilities
 * 
 * Detects whether the app is running as Web, Desktop (Electron), or Mobile (Capacitor)
 */

// Check if running in Electron
export const isElectron = () => {
  return window.electronAPI?.isElectron === true || 
    (typeof window !== 'undefined' && 
    typeof window.process === 'object' && 
    window.process.type === 'renderer');
};

// Check if running in Capacitor (mobile)
export const isCapacitor = () => {
  return typeof window !== 'undefined' && 
    window.Capacitor !== undefined;
};

// Check if running as iOS
export const isIOS = () => {
  return isCapacitor() && window.Capacitor.getPlatform() === 'ios';
};

// Check if running as Android
export const isAndroid = () => {
  return isCapacitor() && window.Capacitor.getPlatform() === 'android';
};

// Check if running as web
export const isWeb = () => {
  return !isElectron() && !isCapacitor();
};

// Get current platform
export const getPlatform = () => {
  if (isElectron()) return 'desktop';
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'web';
};

// Get platform name for display
export const getPlatformName = () => {
  const platform = getPlatform();
  switch (platform) {
    case 'desktop': return 'Desktop';
    case 'ios': return 'iOS';
    case 'android': return 'Android';
    default: return 'Web';
  }
};

// Export all utilities
export default {
  isElectron,
  isCapacitor,
  isIOS,
  isAndroid,
  isWeb,
  getPlatform,
  getPlatformName,
};
