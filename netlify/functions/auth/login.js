// -----------------------------------------------------------------------------
// FILE: netlify/functions/auth/login.js
// PURPOSE: Handles user login (verifies password, issues a token).
// VERSION: 1.0
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { hashPassword, generateToken } from '../utils/auth'; // Import auth helpers

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const sql = neon();

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email and password are required.' }) };
    }

    // Find the user by email
    const users = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    const user = users[0];

    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials.' }) };
    }

    // Compare the provided password hash with the stored hash
    const hashedPassword = hashPassword(password);
    if (hashedPassword !== user.password_hash) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid credentials.' }) };
    }

    // Generate a token for the authenticated user
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Login successful!',
        token: token,
        userId: user.id,
        email: user.email
      }),
    };

  } catch (error) {
    console.error('Error in login function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
