// -----------------------------------------------------------------------------
// FILE: netlify/functions/utils/auth.js
// PURPOSE: Helper functions for authentication using jsonwebtoken.
// VERSION: 2.0 (Using jsonwebtoken for JWTs - FRESH COPY)
// -----------------------------------------------------------------------------

// !!! WARNING: This provides a more robust JWT implementation, but for production
// !!!          you MUST still manage JWT_SECRET securely (e.g., Netlify Environment Variables).
// !!!          Password hashing should use a dedicated library like bcrypt.

import { createHash } from 'crypto'; // Still used for password hashing
import jwt from 'jsonwebtoken';       // Import the jsonwebtoken library

// IMPORTANT: Replace 'your_super_secret_jwt_key_here_change_me_in_prod'
// with a strong, random string (e.g., 32+ characters).
// In a real production app, set this as a Netlify Environment Variable (e.g., JWT_SECRET).
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_insecure_default_secret_for_dev_only_change_this_for_production_sentinel_project';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // Token valid for 24 hours (in seconds)

/**
 * Hashes a password using SHA256.
 * IMPORTANT: This is NOT cryptographically secure for storing passwords directly.
 * For production, use bcrypt or Argon2. This is for demonstration only.
 * @param {string} password - The plain-text password.
 * @returns {string} The SHA256 hash of the password.
 */
export function hashPassword(password) {
  // Ensure Buffer.from is explicitly used with 'utf8' encoding for consistent hashing.
  return createHash('sha256').update(Buffer.from(password, 'utf8')).digest('hex');
}

/**
 * Generates a JSON Web Token (JWT) for user authentication.
 * @param {object} payload - The data to embed in the token (e.g., { userId: 123, email: 'user@example.com' }).
 * @returns {string} The generated JWT string.
 */
export function generateToken(payload) {
  // jwt.sign handles the header, payload, signing, and expiry automatically.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY_SECONDS });
}

/**
 * Verifies a JSON Web Token (JWT) and returns its payload if valid.
 * @param {string} token - The JWT string to verify.
 * @returns {object|null} The decoded token payload if valid, otherwise null.
 */
export function verifyToken(token) {
  try {
    // jwt.verify handles signature checking and expiry validation.
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return null; // Return null on any verification error (e.g., invalid signature, expired).
  }
}

/**
 * Acts as a middleware-like function to protect Netlify Functions.
 * It checks for a valid bearer token in the Authorization header.
 * @param {object} event - The Netlify Function event object (contains headers).
 * @returns {object|null} The decoded token payload (containing userId) if authentication is successful,
 * otherwise returns an HTTP response object with a 401 status.
 */
export function authenticate(event) {
  // Get the Authorization header.
  const authHeader = event.headers.authorization;

  // Check if the header exists and starts with 'Bearer '.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authentication required: Missing or invalid Authorization header.' }),
    };
  }

  // Extract the token string.
  const token = authHeader.split(' ')[1];
  // Verify the token.
  const payload = verifyToken(token);

  // If verification fails, return a 401 response.
  if (!payload) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authentication failed: Invalid or expired token.' }),
    };
  }

  // If authentication is successful, return the payload (which contains user details like userId).
  return payload;
}
