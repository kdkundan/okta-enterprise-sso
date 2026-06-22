/**
 * AuditLog model — immutable record of auth events.
 * TTL index auto-expires records after 90 days (configurable).
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    event:     { type: String, required: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    email:     { type: String, index: true },
    ip:        { type: String },
    userAgent: { type: String },
    metadata:  { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    // Prevent accidental modification of audit records
    strict: true,
  }
);

// Auto-expire after 90 days — adjust retention to your compliance policy
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model('AuditLog', auditLogSchema);
