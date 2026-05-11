const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const qrcodeTerminal = require('qrcode-terminal');
const { getLocalIP } = require('./utils/ip');
const { generateQR } = require('./utils/qr');
const uploadRoute = require('./routes/upload');
const downloadRoute = require('./routes/download');

const app = express();
const PORT = 8080;
const IP = getLocalIP();
const URL = `http://${IP}:${PORT}`;

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected PC browsers
const pcClients = new Set();

wss.on('connection', (ws) => {
  pcClients.add(ws);
  ws.on('close', () => pcClients.delete(ws));
});

// Notify PC browser of new file
function notifyPC(filename, size) {
  const message = JSON.stringify({ filename, size, time: new Date().toLocaleTimeString() });
  pcClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Make notifyPC available to routes
app.set('notifyPC', notifyPC);

const publicPath = process.pkg
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../public');

app.use(express.json());
app.use(express.static(publicPath));

app.use('/upload', uploadRoute);
app.use('/download', downloadRoute);

app.get('/qr', async (req, res) => {
  const qr = await generateQR(URL);
  res.json({ qr, url: URL });
});

app.get('/qrpage', async (req, res) => {
  const qr = await generateQR(URL);
  const logoPath = path.join(__dirname, '../public/logo.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LocalDrop</title>
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #0a0f1e;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 20px;
          min-height: 100vh;
        }
        .logo { width: 180px; margin-bottom: 6px; }
        .tagline { color: #4a9eff; font-size: 0.85rem; margin-bottom: 24px; letter-spacing: 0.5px; }
        .qr-wrap {
          background: #fff;
          padding: 14px;
          border-radius: 20px;
          box-shadow: 0 0 40px rgba(0, 120, 255, 0.25);
        }
        .qr-wrap img { width: 210px; height: 210px; display: block; }
        .url {
          margin-top: 18px;
          background: #111827;
          border: 1px solid #1e3a5f;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 0.82rem;
          color: #4a9eff;
          letter-spacing: 0.3px;
        }
        .feed-title {
          margin-top: 32px;
          font-size: 0.8rem;
          color: #2a4a6e;
          text-transform: uppercase;
          letter-spacing: 1px;
          align-self: flex-start;
          width: 100%;
          max-width: 400px;
        }
        .feed {
          margin-top: 10px;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .feed-item {
          background: #111827;
          border-radius: 10px;
          padding: 12px 16px;
          border-left: 3px solid #1a6fd4;
          animation: fadeIn 0.3s ease;
        }
        .feed-item .name {
          font-size: 0.85rem;
          color: #e0eeff;
          margin-bottom: 4px;
        }
        .feed-item .meta {
          font-size: 0.75rem;
          color: #2a4a6e;
        }
        .empty {
          color: #1e3a5f;
          font-size: 0.85rem;
          margin-top: 10px;
          align-self: flex-start;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </head>
    <body>
      <img class="logo" src="data:image/png;base64,${logoBase64}" alt="LocalDrop Logo" />
      <div class="qr-wrap">
        <img src="${qr}" alt="QR Code" />
      </div>
      <div class="url">${URL}</div>
      <div class="feed-title">📥 Received Files</div>
      <div class="feed" id="feed">
        <div class="empty" id="empty">Waiting for files...</div>
      </div>

      <script>
        const feed = document.getElementById('feed');
        const empty = document.getElementById('empty');
        const ws = new WebSocket('ws://${IP}:${PORT}');

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          empty.style.display = 'none';

          const item = document.createElement('div');
          item.className = 'feed-item';
          item.innerHTML = \`
            <div class="name">✅ \${data.filename}</div>
            <div class="meta">\${data.size} · \${data.time}</div>
          \`;
          feed.prepend(item);
        };
      </script>
    </body>
    </html>
  `);
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ LocalDrop is running\n');
  console.log(`📡 Address: ${URL}\n`);
  console.log('📱 Opening QR code in browser...\n');
  qrcodeTerminal.generate(URL, { small: true });

  const { exec } = require('child_process');
  exec(`start ${URL}/qrpage`);
});