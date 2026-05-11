const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectedFiles = document.getElementById('selectedFiles');
const sendBtn = document.getElementById('sendBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const sendStatus = document.getElementById('sendStatus');
const refreshBtn = document.getElementById('refreshBtn');
const fileListContainer = document.getElementById('fileListContainer');

let filesToSend = [];

// Open file picker
dropZone.addEventListener('click', () => fileInput.click());

// Handle file selection
fileInput.addEventListener('change', () => {
  filesToSend = Array.from(fileInput.files);
  renderSelectedFiles();
});

function renderSelectedFiles() {
  selectedFiles.innerHTML = '';
  filesToSend.forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `<span>${file.name}</span><span>${formatSize(file.size)}</span>`;
    selectedFiles.appendChild(div);
  });
}

// Send files
sendBtn.addEventListener('click', async () => {
  if (filesToSend.length === 0) {
    sendStatus.textContent = 'No files selected.';
    return;
  }

  const formData = new FormData();
  filesToSend.forEach(file => formData.append('files', file));

  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  sendStatus.textContent = 'Sending...';
  sendBtn.disabled = true;

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + '%';
    }
  });

xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      sendStatus.textContent = `✅ ${data.files.length} file(s) sent successfully!`;
      sendStatus.style.color = '#00e0ff';
      progressBar.style.width = '100%';
      filesToSend = [];
      selectedFiles.innerHTML = '';
      fileInput.value = '';
    } else {
      sendStatus.textContent = '❌ Upload failed. Try again.';
      sendStatus.style.color = '#ff4444';
    }
    sendBtn.disabled = false;
  });

  xhr.addEventListener('error', () => {
    sendStatus.textContent = '❌ Network error. Are you on the same WiFi?';
    sendBtn.disabled = false;
  });

  xhr.open('POST', '/upload');
  xhr.send(formData);
});

// Fetch files from PC
refreshBtn.addEventListener('click', async () => {
  fileListContainer.innerHTML = '<div class="file-item">Loading...</div>';
  try {
    const res = await fetch('/download/files');
    const data = await res.json();

    if (data.files.length === 0) {
      fileListContainer.innerHTML = '<div class="file-item">No files available.</div>';
      return;
    }

    fileListContainer.innerHTML = '';
    data.files.forEach(file => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `<span>${decodeURIComponent(file.name)}</span><a href="${file.url}" download>Download</a>`;
      fileListContainer.appendChild(div);
    });
  } catch (err) {
    fileListContainer.innerHTML = '<div class="file-item">❌ Could not fetch files.</div>';
  }
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}