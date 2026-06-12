const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

console.log('[Server] Starting HGM backend...');

dotenv.config({ path: '.env.local' });
console.log('[Server] Env loaded. FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

const PORT = process.env.PORT || 5000;

// Initialize Firebase
let admin;
try {
  const { initializeFirebase } = require('./lib/firebase-init');
  admin = initializeFirebase();
  console.log('[Server] Firebase initialized');
} catch (error) {
  console.error('[Server] Firebase initialization error:', error.message);
  console.error('[Server] Stack:', error.stack);
  process.exit(1);
}

let bookingsRouter, dashboardRouter, hairstyleRouter, usersRouter, salonsRouter;
try {
  bookingsRouter = require('./routes/bookings');
  dashboardRouter = require('./routes/dashboard');
  hairstyleRouter = require('./routes/hairstyle');
  usersRouter = require('./routes/users');
  salonsRouter = require('./routes/salons');
  console.log('[Server] Routes imported successfully');
} catch (error) {
  console.error('[Server] Route import error:', error.message);
  console.error('[Server] Stack:', error.stack);
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('HGM backend is running');
});

app.use('/api/bookings', bookingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/hairstyle', hairstyleRouter);
app.use('/api/users', usersRouter);
app.use('/api/salons', salonsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(PORT, () => {
  console.log(`[Server] ✓ Backend listening on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('[Server] Listen error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is already in use. Kill the process or use a different PORT.`);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});
