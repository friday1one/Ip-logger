// -----------------------------------------------------------------------------
// FILE: netlify/functions/auth/register.js
// PURPOSE: Handles new user registration (email, password hashing, saving to DB).
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

    // Hash the password
    const hashedPassword = hashPassword(password);

    // Check if user already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      return { statusCode: 409, body: JSON.stringify({ message: 'User with this email already exists.' }) };
    }

    // Insert new user into the database
    const newUser = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashedPassword})
      RETURNING id, email;
    `;

    const userId = newUser[0].id;
    // Generate a token for the newly registered user
    const token = generateToken({ userId: userId, email: newUser[0].email });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'User registered successfully!',
        token: token,
        userId: userId,
        email: newUser[0].email
      }),
    };

  } catch (error) {
    console.error('Error in register function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
