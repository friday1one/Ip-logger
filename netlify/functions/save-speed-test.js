// -----------------------------------------------------------------------------
// FILE: netlify/functions/save-speed-test.js
// PURPOSE: Saves a new speed test result to Netlify DB, associated with the authenticated user.
// VERSION: 1.1 (Protected and User-Specific - FRESH COPY)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { authenticate } from './utils/auth'; // Import auth helper from utils folder (relative path)

export async function handler(event) {
  // Ensure only POST requests are allowed.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Authenticate the incoming request.
  const authResult = authenticate(event);
  if (authResult.statusCode) {
    return authResult;
  }
  const userId = authResult.userId; // Extract userId from the authenticated payload.

  const sql = neon(); // Initialize Neon client.
  try {
    // Parse the speed test data from the request body.
    const data = JSON.parse(event.body);

    // Validate the received data.
    if (typeof data.download_mbps === 'undefined' || typeof data.upload_mbps === 'undefined' || typeof data.latency_ms === 'undefined') {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing speed test data (download_mbps, upload_mbps, latency_ms).' }) };
    }

    // Insert the speed test results into the 'speed_tests' table, linked to the user.
    // 'NOW()' uses the database's current timestamp.
    await sql`
      INSERT INTO speed_tests (download_mbps, upload_mbps, latency_ms, user_id, timestamp)
      VALUES (
        ${data.download_mbps},
        ${data.upload_mbps},
        ${data.latency_ms},
        ${userId},
        NOW()
      )
    `;
    // Return success response.
    return { statusCode: 200, body: JSON.stringify({ message: 'Speed test saved successfully' }) };
  } catch (error) {
    // Log any errors and return a 500 Internal Server Error response.
    console.error('Error in save-speed-test function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
