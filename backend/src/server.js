/**
 * Entry point — Express server setup.
 *
 * Middleware order matters:
 *  1. Security headers (helmet)
 *  2. CORS — must come before routes so pre-flight OPTIONS requests are handled
 *  3. Body parsers
 *  4. Cookie parser
 *  5. Session (needed by passport for ACS callback state)
 *  6. Passport init
 *  7. Request logging (morgan)
 *  8. Routes
 *  9. Error handler (last)
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import morgan from 'morgan';
import passport, { initPassport } from './auth/passport.js';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // Allow Okta to POST to ACS — helmet's CSP would block cross-origin POSTs otherwise
    contentSecurityPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // required for cookies to be sent cross-origin
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // passport-saml needs this to parse SAML POST body

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Session ───────────────────────────────────────────────────────────────────
// express-session is used by passport during the SAML ACS callback.
// In production, swap MemoryStore for connect-mongo or connect-redis.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 5 * 60 * 1000, // 5 min — only needed for the SAML round-trip
    },
  })
);

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan('combined'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/health', healthRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  // Register SAML strategy now — env vars are loaded via dotenv/config above
  initPassport();
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`[Server] Running on http://localhost:${PORT}`, {
      env: process.env.NODE_ENV || 'development',
    });
  });
};

start();

export default app;
