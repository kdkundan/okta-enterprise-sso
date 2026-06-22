/**
 * User model — upserted on every successful SAML login.
 *
 * roleOverride: if set, takes precedence over the SAML group-derived role.
 * This allows an admin to manually promote/demote a user without changing Okta groups.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName:    { type: String, trim: true },
    lastName:     { type: String, trim: true },
    username:     { type: String, trim: true },
    groups:       [{ type: String }],
    role:         { type: String, enum: ['admin', 'shift_manager', 'supervisor', 'operator'], required: true },
    roleOverride: { type: String, enum: ['admin', 'shift_manager', 'supervisor', 'operator', null], default: null },
    authProvider: { type: String, default: 'okta-saml' },
    nameID:       { type: String },
    lastLoginAt:  { type: Date },
    loginCount:   { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: effective role (override wins if set)
userSchema.virtual('effectiveRole').get(function () {
  return this.roleOverride || this.role;
});

userSchema.set('toJSON', { virtuals: true });

export default mongoose.model('User', userSchema);
