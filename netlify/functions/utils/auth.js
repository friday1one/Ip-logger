// -----------------------------------------------------------------------------
// FILE: netlify/functions/utils/auth.js
// PURPOSE: Helper functions for authentication (token generation and validation).
// VERSION: 1.2 (Final, hardened for Node.js environment)
// -----------------------------------------------------------------------------

// !!! WARNING: This is a simplified authentication mechanism for demonstration. !!!
// !!! It is NOT secure for production use without significant enhancements.   !!!
// !!! Specifically, proper JWT libraries and robust secret management (e.g., Netlify Environment Variables) are needed. !!!

import { createHash } from 'crypto'; // Node.js built-in crypto module

// IMPORTANT: Replace 'your_super_secret_jwt_key_here_change_me_in_prod'
// with a strong, random string (e.g., 32+ characters).
// In a real production app, set this as a Netlify Environment Variable (e.g., JWT_SECRET).
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_insecure_default_secret_for_dev_only_change_this_for_production_sentinel_project';
const TOKEN_EXPIRY_HOURS = 24; // Token valid for 24 hours

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
 * Generates a simple JWT-like token for user authentication.
 * This is a custom, simplified token structure, not a standard JWT.
 * For robust, production-ready JWTs, use a library like 'jsonwebtoken'.
 * @param {object} payload - The data to embed in the token (e.g., { userId: 123, email: 'user@example.com' }).
 * @returns {string} The generated token string.
 */
export function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }; // Algorithm and type (simplified)
  // Calculate expiry timestamp (milliseconds since epoch)
  const expiry = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  const data = { ...payload, exp: expiry }; // Combine payload with expiry

  // Base64url encode header and data.
  // Buffer.from(string, 'utf8') is crucial for consistent byte representation.
  const base64EncodedHeader = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
  const base64EncodedData = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');

  // Create the signature input string.
  const signatureInput = `${base64EncodedHeader}.${base64EncodedData}`;
  // Generate a simple HMAC-like signature using SHA256 and the secret.
  const signature = createHash('sha256').update(Buffer.from(signatureInput + JWT_SECRET, 'utf8')).digest('hex');

  // Concatenate parts to form the token.
  return `${base64EncodedHeader}.${base64EncodedData}.${signature}`;
}

/**
 * Verifies a custom token and returns its payload if it's valid and not expired.
 * @param {string} token - The token string to verify.
 * @returns {object|null} The decoded token payload if valid, otherwise null.
 */
export function verifyToken(token) {
  try {
    const parts = token.split('.');
    // A valid token should have exactly three parts (header.payload.signature)
    if (parts.length !== 3) {
        console.warn('Token verification failed: Incorrect number of parts.');
        return null;
    }

    const [headerB64, payloadB64, signature] = parts;

    // Recreate the expected signature using the header, payload, and secret.
    const expectedSignature = createHash('sha256').update(Buffer.from(`${headerB64}.${payloadB64}` + JWT_SECRET, 'utf8')).digest('hex');

    // Compare the received signature with the expected signature.
    if (signature !== expectedSignature) {
      console.warn('Token verification failed: Signature mismatch.');
      return null;
    }

    // Decode the payload from base64url and parse as JSON.
    const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Check if the token has expired.
    if (decodedPayload.exp && decodedPayload.exp < Date.now()) {
      console.warn('Token verification failed: Token expired.');
      return null;
    }

    // If all checks pass, return the decoded payload.
    return decodedPayload;
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return null; // Return null on any error during verification.
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
