/**
 * Session model — tracks active JWT sessions.
 * Enables server-side session revocation (e.g. force-logout all sessions for a user).
 * TTL index cleans up expired sessions automatically.
 */

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email:     { type: String, required: true },
    role:      { type: String },
    ip:        { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    revoked:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete documents after expiresAt
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
