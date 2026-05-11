const ip = require('ip');

function getLocalIP() {
  return ip.address();
}

module.exports = { getLocalIP };