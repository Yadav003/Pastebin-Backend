function ensureJson(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
}

function jsonErrorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    error: err.message || 'Internal server error',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

module.exports = { ensureJson, jsonErrorHandler, notFoundHandler };
