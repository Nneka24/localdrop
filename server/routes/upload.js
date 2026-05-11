const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const downloadsDir = path.join(process.env.USERPROFILE, 'Desktop', 'LocalDrop Files');

// Create folder if it doesn't exist
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, downloadsDir);
  },
  filename: function (req, file, cb) {
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(original);
    const name = path.basename(original, ext);
    let finalName = original;

    // Handle duplicates
    if (fs.existsSync(path.join(downloadsDir, finalName))) {
      let counter = 1;
      while (fs.existsSync(path.join(downloadsDir, `${name}(${counter})${ext}`))) {
        counter++;
      }
      finalName = `${name}(${counter})${ext}`;
    }

    cb(null, finalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit
});

router.post('/', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const notifyPC = req.app.get('notifyPC');
  const fileNames = req.files.map(f => {
    const size = formatSize(f.size);
    notifyPC(f.filename, size);
    return f.filename;
  });

  console.log('Received files:', fileNames);
  res.json({ success: true, files: fileNames });
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = router;