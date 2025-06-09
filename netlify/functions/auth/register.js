// -----------------------------------------------------------------------------
// FILE: netlify/functions/auth/register.js
// PURPOSE: Handles new user registration (email, password hashing, saving to DB).
// VERSION: 1.0 (Final)
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

    // Hash the provided password.
    const hashedPassword = hashPassword(password);

    // Check if a user with this email already exists in the database.
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.length > 0) {
      // If user exists, return a 409 Conflict status.
      return { statusCode: 409, body: JSON.stringify({ message: 'User with this email already exists.' }) };
    }

    // Insert the new user into the 'users' table.
    // 'RETURNING id, email' gets the newly created user's ID and email back.
    const newUser = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashedPassword})
      RETURNING id, email;
    `;

    const userId = newUser[0].id;
    // Generate an authentication token for the newly registered user.
    const token = generateToken({ userId: userId, email: newUser[0].email });

    // Return success response with the generated token and user details.
    return {
      statusCode: 201, // 201 Created status code.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'User registered successfully!',
        token: token,
        userId: userId,
        email: newUser[0].email
      }),
    };

  } catch (error) {
    // Log and return a 500 Internal Server Error response on any exception.
    console.error('Error in register function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
