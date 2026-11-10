import type { PlatformAdapter } from './types';

export class WebAdapter implements PlatformAdapter {
  platform: 'web' | 'desktop' = 'web';

  async saveFile(data: Blob, filename: string): Promise<string> {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  }

  async readFile(_path: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) resolve(file);
        else reject(new Error('No file selected'));
      };
      input.click();
    });
  }

  async print(content: string): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  }

  async showNotification(title: string, body: string): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  async createBackup(): Promise<Blob> {
    const { db } = await import('../schema');
    const data: Record<string, unknown[]> = {};
    const tables = db.tables;
    for (const table of tables) {
      data[table.name] = await table.toArray();
    }
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  async restoreBackup(data: Blob): Promise<void> {
    const { db } = await import('../schema');
    const text = await data.text();
    const parsed = JSON.parse(text) as Record<string, unknown[]>;
    
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        await table.clear();
        const tableData = parsed[table.name];
        if (tableData && Array.isArray(tableData)) {
          await table.bulkAdd(tableData);
        }
      }
    });
  }
}

export const webAdapter = new WebAdapter();
