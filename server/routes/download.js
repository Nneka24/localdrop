const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const downloadsDir = path.join(process.env.USERPROFILE, 'Desktop', 'LocalDrop Files');
router.get('/files', (req, res) => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read downloads folder' });
    }
    const fileList = files.map(file => ({
      name: file,
      url: `/download/get/${encodeURIComponent(file)}`
    }));
    res.json({ files: fileList });
  });
});

router.get('/get/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(downloadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

module.exports = router;