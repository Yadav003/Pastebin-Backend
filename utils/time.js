
const config = require('../config');


function getCurrentTime(req) {
  if (config.testMode) {
    const testTimeMs = req?.headers?.['x-test-now-ms'];
    if (testTimeMs !== undefined && testTimeMs !== null && testTimeMs !== '') {
      const timestamp = parseInt(testTimeMs, 10);
      if (!isNaN(timestamp) && timestamp >= 0) {
        return new Date(timestamp);
      }
    }
  }
  return new Date();
}

module.exports = { getCurrentTime };
