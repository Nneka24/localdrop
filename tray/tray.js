const { app, BrowserWindow } = require('electron');
const path = require('path');
const { getLocalIP } = require('../server/utils/ip');
const { generateQR } = require('../server/utils/qr');

// Start the express server
require('../server/index');

const IP = getLocalIP();
const PORT = 8080;
const URL = `http://${IP}:${PORT}`;

let win;

async function createWindow() {
  const qrDataURL = await generateQR(URL);

  win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    title: 'LocalDrop',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #0f0f0f;
          color: #fff;
          text-align: center;
          padding: 30px 20px;
          margin: 0;
        }
        h1 { color: #00e0ff; font-size: 1.8rem; margin-bottom: 4px; }
        p { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
        img { width: 220px; height: 220px; border-radius: 12px; background: #fff; padding: 10px; }
        .url {
          margin-top: 16px;
          background: #1a1a1a;
          border-radius: 8px;
          padding: 10px;
          font-size: 0.8rem;
          color: #00e0ff;
          word-break: break-all;
        }
        .status {
          margin-top: 12px;
          font-size: 0.75rem;
          color: #555;
        }
      </style>
    </head>
    <body>
      <h1>📦 LocalDrop</h1>
      <p>Scan to connect from your phone</p>
      <img src="${qrDataURL}" alt="QR Code" />
      <div class="url">${URL}</div>
      <div class="status">⚡ Server running — waiting for connections</div>
    </body>
    </html>
  `;

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  win.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});