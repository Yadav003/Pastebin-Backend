require('dotenv').config();

const express = require('express');
const cors = require('cors');
// const path = require('path');
const config = require('./config');
const { healthRouter, pastesRouter, viewRouter } = require('./routes');
const { ensureJson, jsonErrorHandler, notFoundHandler } = require('./middleware');
const db = require('./db');
const { initializeDatabase } = require('./db/init');

const app = express();


app.use(cors());

// Initialize database on first request
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
  next();
});

// app.use(cors());

app.use(express.json());

// HTML view route
app.use(viewRouter);


app.use('/api', ensureJson);
app.use('/api', healthRouter);
app.use('/api', pastesRouter);

// Static files in production
// if (config.nodeEnv === 'production') {
//   app.use(express.static(path.join(__dirname, 'public')));
//   app.get('/*', (req, res, next) => {
//     if (req.path.startsWith('/api') || req.path.startsWith('/p/')) {
//       return next();
//     }
//     // res.sendFile(path.join(__dirname, 'public', 'index.html'));
//   });
// }

app.use('/api', notFoundHandler);
app.use(jsonErrorHandler);

if (require.main === module) {
  initializeDatabase().then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  });
}

process.on('SIGTERM', async () => {
  await db.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await db.closePool();
  process.exit(0);
});

module.exports = app;
