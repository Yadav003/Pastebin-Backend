
function checkPasteAvailability(paste, currentTime) {
  if (!paste) {
    return { available: false, reason: 'not_found' };
  }

  if (paste.expires_at !== null && paste.expires_at !== undefined) {
    if (currentTime >= new Date(paste.expires_at)) {
      return { available: false, reason: 'expired' };
    }
  }

  if (paste.max_views !== null && paste.max_views !== undefined) {
    if ((paste.views_used ?? 0) >= paste.max_views) {
      return { available: false, reason: 'view_limit_reached' };
    }
  }

  return { available: true, reason: null };
}

function calculateExpiresAt(ttlSeconds, fromTime = new Date()) {
  return new Date(fromTime.getTime() + ttlSeconds * 1000);
}

module.exports = { checkPasteAvailability, calculateExpiresAt };
