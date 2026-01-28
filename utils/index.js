const { getCurrentTime } = require('./time');
const { checkPasteAvailability, calculateExpiresAt } = require('./paste');
const { validateContent, validateTtlSeconds, validateMaxViews, validatePasteInput } = require('./validation');

module.exports = {
  getCurrentTime,
  checkPasteAvailability,
  calculateExpiresAt,
  validateContent,
  validateTtlSeconds,
  validateMaxViews,
  validatePasteInput,
};
