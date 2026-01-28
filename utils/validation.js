function validateContent(content) {
  if (content === undefined || content === null) {
    return { valid: false, error: 'Content is required' };
  }
  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }
  if (content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  return { valid: true, error: null };
}

function validateTtlSeconds(ttlSeconds) {
  if (ttlSeconds === undefined || ttlSeconds === null) {
    return { valid: true, error: null };
  }
  const parsed = parseInt(ttlSeconds, 10);
  if (isNaN(parsed)) {
    return { valid: false, error: 'TTL must be a valid integer' };
  }
  if (parsed < 1) {
    return { valid: false, error: 'TTL must be at least 1 second' };
  }
  return { valid: true, error: null };
}

function validateMaxViews(maxViews) {
  if (maxViews === undefined || maxViews === null) {
    return { valid: true, error: null };
  }
  const parsed = parseInt(maxViews, 10);
  if (isNaN(parsed)) {
    return { valid: false, error: 'Max views must be a valid integer' };
  }
  if (parsed < 1) {
    return { valid: false, error: 'Max views must be at least 1' };
  }
  return { valid: true, error: null };
}

function validatePasteInput(input) {
  const errors = {};
  
  const contentResult = validateContent(input?.content);
  if (!contentResult.valid) errors.content = contentResult.error;
  
  const ttlResult = validateTtlSeconds(input?.ttl_seconds);
  if (!ttlResult.valid) errors.ttl_seconds = ttlResult.error;
  
  const maxViewsResult = validateMaxViews(input?.max_views);
  if (!maxViewsResult.valid) errors.max_views = maxViewsResult.error;

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateContent, validateTtlSeconds, validateMaxViews, validatePasteInput };
