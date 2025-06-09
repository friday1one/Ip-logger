// -----------------------------------------------------------------------------
// FILE: netlify/functions/save-speed-test.js
// PURPOSE: Saves a new speed test result to Netlify DB, associated with the authenticated user.
// VERSION: 1.1 (Protected and User-Specific)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { authenticate } from '../utils/auth'; // Import auth helper

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authResult = authenticate(event); // Authenticate the request
  if (authResult.statusCode) { // If authentication failed, authResult is an HTTP response
    return authResult;
  }
  const userId = authResult.userId; // Extract userId from the authenticated payload

  const sql = neon();
  try {
    const data = JSON.parse(event.body);

    if (typeof data.download_mbps === 'undefined' || typeof data.upload_mbps === 'undefined' || typeof data.latency_ms === 'undefined') {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing speed test data (download_mbps, upload_mbps, latency_ms).' }) };
    }

    await sql`
      INSERT INTO speed_tests (download_mbps, upload_mbps, latency_ms, user_id, timestamp)
      VALUES (
        ${data.download_mbps},
        ${data.upload_mbps},
        ${data.latency_ms},
        ${userId},
        NOW() -- Use database timestamp for consistency
      )
    `;
    return { statusCode: 200, body: JSON.stringify({ message: 'Speed test saved successfully' }) };
  } catch (error) {
    console.error('Error in save-speed-test function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
