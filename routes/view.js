const express = require('express');
const db = require('../db');
const config = require('../config');
const { getCurrentTime } = require('../utils');

const router = express.Router();

function escapeHtml(text) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}


function generatePasteHtml(paste) {
  const escapedContent = escapeHtml(paste.content);
  const expiresInfo = paste.expires_at 
    ? `<p class="meta">Expires: ${new Date(paste.expires_at).toLocaleString()}</p>` 
    : '';
  const viewsInfo = paste.remaining_views !== null 
    ? `<p class="meta">Remaining views: ${paste.remaining_views}</p>` 
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paste - Pastebin Lite</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #00d9ff;
      margin-bottom: 1rem;
    }
    .meta {
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .content {
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 1rem;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.5;
      overflow-x: auto;
    }
    a {
      color: #00d9ff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .back-link {
      display: inline-block;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Pastebin Lite</h1>
    ${expiresInfo}
    ${viewsInfo}
    <div class="content">${escapedContent}</div>
    <a href="${config.frontendUrl}" class="back-link">← Create new paste</a>
  </div>
</body>
</html>`;
}


function generate404Html() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found - Pastebin Lite</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    }
    .container {
      max-width: 500px;
    }
    h1 {
      color: #ff6b6b;
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    p {
      color: #888;
      margin-bottom: 1.5rem;
    }
    a {
      color: #00d9ff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>This paste doesn't exist, has expired, or has reached its view limit.</p>
    <a href="${config.frontendUrl}">← Create a new paste</a>
  </div>
</body>
</html>`;
}


router.get('/p/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentTime = getCurrentTime(req);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(generate404Html());
    }

    // Atomic fetch and increment views_used
    const atomicQuery = `
      UPDATE pastes
      SET views_used = views_used + 1
      WHERE id = $1
        AND (expires_at IS NULL OR expires_at > $2)
        AND (max_views IS NULL OR views_used < max_views)
      RETURNING 
        content,
        expires_at,
        max_views,
        views_used
    `;

    const result = await db.query(atomicQuery, [id, currentTime.toISOString()]);

    if (result.rows.length === 0) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(generate404Html());
    }

    const paste = result.rows[0];

    // Calculate remaining_views
    let remainingViews = null;
    if (paste.max_views !== null) {
      remainingViews = Math.max(0, paste.max_views - paste.views_used);
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(generatePasteHtml({
      content: paste.content,
      expires_at: paste.expires_at,
      remaining_views: remainingViews,
    }));
  } catch (error) {
    console.error('Error fetching paste HTML:', error.message);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(generate404Html());
  }
});

module.exports = router;
