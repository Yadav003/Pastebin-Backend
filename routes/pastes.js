const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const config = require("../config");
const {
  getCurrentTime,
  checkPasteAvailability,
  calculateExpiresAt,
  validatePasteInput,
} = require("../utils");

const router = express.Router();

// POST /api/pastes - Create a new paste
router.post("/pastes", async (req, res) => {
  try {
    // Use test time if TEST_MODE=1 and x-test-now-ms header present
    const currentTime = getCurrentTime(req);

    const validation = validatePasteInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const { content, ttl_seconds, max_views } = req.body;
    const id = crypto.randomUUID();

    // TTL is calculated once at creation time
    let expiresAt = null;
    if (ttl_seconds !== undefined && ttl_seconds !== null) {
      expiresAt = calculateExpiresAt(parseInt(ttl_seconds, 10), currentTime);
    }

    const maxViews =
      max_views !== undefined && max_views !== null
        ? parseInt(max_views, 10)
        : null;

    const insertQuery = `
      INSERT INTO pastes (id, content, created_at, expires_at, max_views, views_used)
      VALUES ($1, $2, $3, $4, $5, 0)
      RETURNING id
    `;

    await db.query(insertQuery, [
      id,
      content,
      currentTime.toISOString(),
      expiresAt ? expiresAt.toISOString() : null,
      maxViews,
    ]);

    const url = `${config.baseUrl}/p/${id}`;

    return res.status(201).json({
      id,
      url,
    });
  } catch (error) {
    console.error("Error creating paste:", error.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to create paste",
    });
  }
});

// GET /api/pastes/:id - Retrieve a paste
router.get("/pastes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const currentTime = getCurrentTime(req);

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(404).json({
        ok: false,
        error: "Paste not found",
      });
    }

    // Atomic UPDATE ensures concurrency safety: increment + availability check
    // in single query prevents race conditions exceeding max_views
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
      return res.status(404).json({
        ok: false,
        error: "Paste not found",
      });
    }

    const paste = result.rows[0];

    // remaining_views is null for unlimited, never negative
    let remainingViews = null;
    if (paste.max_views !== null) {
      remainingViews = Math.max(0, paste.max_views - paste.views_used);
    }

    const expiresAt = paste.expires_at
      ? new Date(paste.expires_at).toISOString()
      : null;

    return res.status(200).json({
      content: paste.content,
      remaining_views: remainingViews,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("Error fetching paste:", error.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch paste",
    });
  }
});

module.exports = router;
