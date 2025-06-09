// -----------------------------------------------------------------------------
// FILE: netlify/functions/utils/auth.js
// PURPOSE: Helper functions for authentication (token generation and validation).
// VERSION: 1.0 (Demonstration level security - NOT FOR PRODUCTION)
// -----------------------------------------------------------------------------

// !!! WARNING: This is a simplified authentication mechanism for demonstration. !!!
// !!! It is NOT secure for production use without significant enhancements.   !!!
// !!! Specifically, proper JWT libraries and robust secret management are needed. !!!

import { createHash, randomBytes } from 'crypto';

// A simple, hardcoded secret for demonstration. IN PRODUCTION, use environment variables!
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_me_in_prod';
const TOKEN_EXPIRY_HOURS = 24; // Token valid for 24 hours

/**
 * Hashes a password using SHA256.
 * WARNING: This is NOT cryptographically secure for passwords.
 * For production, use bcrypt or Argon2.
 * @param {string} password - The plain-text password.
 * @returns {string} The SHA256 hash of the password.
 */
export function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Generates a simple JWT-like token.
 * This is a custom, simplified token, not a standard JWT.
 * For production, use 'jsonwebtoken' library.
 * @param {object} payload - The data to embed in the token (e.g., { userId: 123 }).
 * @returns {string} The generated token.
 */
export function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const expiry = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000; // Expiry in milliseconds
  const data = { ...payload, exp: expiry }; // Add expiry to payload

  const base64EncodedHeader = Buffer.from(JSON.stringify(header)).toString('base66url');
  const base64EncodedData = Buffer.from(JSON.stringify(data)).toString('base66url');

  const signatureInput = `${base64EncodedHeader}.${base64EncodedData}`;
  const signature = createHash('sha256').update(signatureInput + JWT_SECRET).digest('hex'); // Simple HMAC-like signature

  return `${base64EncodedHeader}.${base64EncodedData}.${signature}`;
}

/**
 * Verifies a token and returns its payload if valid.
 * @param {string} token - The token string.
 * @returns {object|null} The decoded payload if valid, otherwise null.
 */
export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;

    // Recreate signature to verify
    const expectedSignature = createHash('sha256').update(`${headerB64}.${payloadB64}` + JWT_SECRET).digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Token verification failed: Signature mismatch.');
      return null;
    }

    const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base66url').toString('utf8'));

    // Check expiry
    if (decodedPayload.exp && decodedPayload.exp < Date.now()) {
      console.warn('Token verification failed: Token expired.');
      return null;
    }

    return decodedPayload;
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return null;
  }
}

/**
 * Middleware-like function to protect Netlify Functions.
 * Call this at the beginning of your protected function handlers.
 * @param {object} event - The Netlify Function event object.
 * @returns {object|null} The decoded token payload if authenticated, otherwise returns an HTTP response object.
 */
export function authenticate(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authentication required: Missing or invalid Authorization header.' }),
    };
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authentication failed: Invalid or expired token.' }),
    };
  }

  // If successful, return the payload (which contains userId)
  return payload;
}
