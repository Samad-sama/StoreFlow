// Platform adapter interface — ready for Tauri SQLite in the future
export interface PlatformAdapter {
  platform: 'web' | 'desktop';
  
  // File system
  saveFile(data: Blob, filename: string): Promise<string>;
  readFile(path: string): Promise<Blob>;
  
  // Printing
  print(content: string): Promise<void>;
  
  // Notifications
  showNotification(title: string, body: string): Promise<void>;
  
  // Backup
  createBackup(): Promise<Blob>;
  restoreBackup(data: Blob): Promise<void>;
}
