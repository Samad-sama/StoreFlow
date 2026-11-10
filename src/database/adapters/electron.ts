import type { PlatformAdapter } from './types';
import { WebAdapter } from './web';

export class ElectronAdapter extends WebAdapter implements PlatformAdapter {
  override platform: 'desktop' = 'desktop';

  override async showNotification(title: string, body: string): Promise<void> {
    if ('Notification' in window) {
      new Notification(title, { body });
    }
  }

  override async print(content: string): Promise<void> {
    const api = (window as any).electronAPI;
    if (api?.printThermalReceipt) {
      await api.printThermalReceipt(content);
    } else {
      await super.print(content);
    }
  }
}

export const electronAdapter = new ElectronAdapter();
