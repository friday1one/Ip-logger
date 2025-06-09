// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-browser-ip.js
// PURPOSE: Receives the client's public IP from the frontend, checks if it has
//          changed from the last logged IP for the authenticated user, and saves
//          it to the database, associated with that user.
// VERSION: 1.1 (Protected and User-Specific - FRESH COPY)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { authenticate } from './utils/auth'; // Import auth helper from utils folder (relative path)

export async function handler(event) {
  // Ensure only POST requests are allowed.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // Authenticate the incoming request.
  const authResult = authenticate(event);
  if (authResult.statusCode) {
    return authResult;
  }
  const userId = authResult.userId; // Extract userId from the authenticated payload.

  const sql = neon(); // Initialize Neon client.
  console.log(`Received request to log browser IP for user_id: ${userId}`);

  try {
    // Parse the client's IP details from the request body.
    const clientIpDetails = JSON.parse(event.body);

    // Basic validation for essential IP details.
    if (!clientIpDetails || !clientIpDetails.ip) {
      throw new Error("Invalid or missing IP details in request body.");
    }

    // Get the most recent IP log for THIS AUTHENTICATED USER from the database.
    const lastLogResult = await sql`SELECT ip FROM ip_logs WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 1`;
    const lastLoggedIp = lastLogResult.length > 0 ? lastLogResult[0].ip : null;

    // Compare the received client IP with the last logged IP for this user.
    if (clientIpDetails.ip !== lastLoggedIp) {
      console.log(`Browser IP change detected for user ${userId}. Old: ${lastLoggedIp || 'None'}, New: ${clientIpDetails.ip}. Logging.`);

      const currentTimestamp = new Date().toISOString();

      // Insert the new browser IP into the ip_logs table, explicitly linked to the user.
      await sql`
        INSERT INTO ip_logs (ip, hostname, city, region, country, loc, org, postal, timezone, timestamp, user_id)
        VALUES (
          ${clientIpDetails.ip},
          ${clientIpDetails.hostname || null},
          ${clientIpDetails.city || null},
          ${clientIpDetails.region || null},
          ${clientIpDetails.country || null},
          ${clientIpDetails.loc || null},
          ${clientIpDetails.org || null},
          ${clientIpDetails.postal || null},
          ${clientIpDetails.timezone || null},
          ${currentTimestamp},
          ${userId}
        )
      `;
      return { statusCode: 200, body: JSON.stringify({ message: 'New browser IP logged successfully.', currentIp: clientIpDetails.ip }) };
    } else {
      console.log('Browser IP has not changed for user. No new log created.');
      return { statusCode: 200, body: JSON.stringify({ message: 'Browser IP has not changed.', currentIp: clientIpDetails.ip }) };
    }

  } catch (error) {
    // Log any errors and return a 500 Internal Server Error response.
    console.error('Error in log-browser-ip function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message || 'Unknown error occurred.'}` }) };
  }
}
