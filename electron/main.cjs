const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let localServer = null;

// MIME types for local static server
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

// Start local loopback HTTP server to serve dist cleanly with proper web origin
function startLocalServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/' || !reqPath) reqPath = '/index.html';

        let filePath = path.join(distDir, reqPath);

        // Fallback for SPA routing: if file doesn't exist, serve index.html
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading file: ' + err.message);
            return;
          }
          res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          });
          res.end(data);
        });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error: ' + err.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[StoreFlow Desktop Server] Running on http://127.0.0.1:${port}`);
      resolve({ server, port, url: `http://127.0.0.1:${port}` });
    });

    server.on('error', (err) => {
      console.error('[StoreFlow Desktop Server Error]', err);
      reject(err);
    });
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'icon.ico')
    : path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'StoreFlow — نظام إدارة المتاجر والمبيعات',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      spellcheck: true,
    },
  });

  // Smooth show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle external links in native default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Track maximize state
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-change', false);
  });

  // Dev server or Production local HTTP server
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl).catch(() => {
      setTimeout(() => mainWindow.loadURL(devUrl), 1000);
    });
  } else {
    try {
      const distPath = path.join(__dirname, '../dist');
      const { server, url } = await startLocalServer(distPath);
      localServer = server;
      mainWindow.loadURL(url);
    } catch (err) {
      console.error('Failed to start local server, falling back to loadFile:', err);
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }

  // Application Menu
  const template = [
    {
      label: 'ملف (File)',
      submenu: [
        {
          label: 'نقطة البيع السريعة (POS)',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.executeJavaScript("window.location.hash = '#/pos'"),
        },
        {
          label: 'سجل المبيعات (Sales)',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.executeJavaScript("window.location.hash = '#/sales'"),
        },
        { type: 'separator' },
        { label: 'خروج (Exit)', role: 'quit', accelerator: 'Alt+F4' },
      ],
    },
    {
      label: 'تعديل (Edit)',
      submenu: [
        { label: 'تراجع (Undo)', role: 'undo' },
        { label: 'إعادة (Redo)', role: 'redo' },
        { type: 'separator' },
        { label: 'قص (Cut)', role: 'cut' },
        { label: 'نسخ (Copy)', role: 'copy' },
        { label: 'لصق (Paste)', role: 'paste' },
        { label: 'تحديد الكل (Select All)', role: 'selectAll' },
      ],
    },
    {
      label: 'عرض (View)',
      submenu: [
        { label: 'إعادة تحميل (Reload)', role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { label: 'تكبير الشاشة (Fullscreen)', role: 'togglefullscreen', accelerator: 'F11' },
        {
          label: 'أدوات المطور (DevTools)',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        { label: 'تكبير النص (Zoom In)', role: 'zoomIn' },
        { label: 'تصغير النص (Zoom Out)', role: 'zoomOut' },
        { label: 'الحجم الافتراضي (Reset Zoom)', role: 'resetZoom' },
      ],
    },
    {
      label: 'مساعدة (Help)',
      submenu: [
        {
          label: 'حول StoreFlow (About)',
          click: () => mainWindow.webContents.executeJavaScript("window.location.hash = '#/settings'"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (localServer) {
    localServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Native silent printing for thermal receipts
ipcMain.handle('print-thermal-receipt', async (event, htmlContent) => {
  const printWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  return new Promise((resolve) => {
    printWin.webContents.print(
      {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
      },
      (success, failureReason) => {
        printWin.close();
        resolve({ success, failureReason });
      }
    );
  });
});
