// Type definitions for Electron preload API
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  platform: string;
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
