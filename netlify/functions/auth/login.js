// -----------------------------------------------------------------------------
// FILE: netlify/functions/auth/login.js
// PURPOSE: Handles user login (verifies password, issues a token).
// VERSION: 1.0 (Final - FRESH COPY)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { hashPassword, generateToken } from '../utils/auth'; // Import auth helpers from utils folder

export async function handler(event) {
  // Ensure only POST requests are allowed.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const sql = neon(); // Initialize Neon client.

  try {
    // Parse the request body to get email and password.
    const { email, password } = JSON.parse(event.body);

    // Validate input.
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email and password are required.' }) };
    }

    // Query the database for a user with the provided email.
    const users = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    const user = users[0]; // Get the first (and hopefully only) user found.

    // If no user is found, return an authentication failure.
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials.' }) };
    }

    // Hash the provided password and compare it with the stored hash.
    const hashedPassword = hashPassword(password);
    if (hashedPassword !== user.password_hash) {
      // If passwords don't match, return an authentication failure.
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials.' }) };
    }

    // If authentication is successful, generate a new token for the user.
    const token = generateToken({ userId: user.id, email: user.email });

    // Return success response with the generated token and user details.
    return {
      statusCode: 200, // 200 OK status code.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Login successful!',
        token: token,
        userId: user.id,
        email: user.email
      }),
    };

  } catch (error) {
    // Log and return a 500 Internal Server Error response on any exception.
    console.error('Error in login function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
