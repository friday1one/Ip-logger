// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-browser-ip.js
// PURPOSE: Receives the client's public IP from the frontend, checks if it has
//          changed from the last logged IP, and saves it to the database,
//          associated with the authenticated user.
// VERSION: 1.1 (Protected and User-Specific)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { authenticate } from '../utils/auth'; // Import auth helper

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const authResult = authenticate(event); // Authenticate the request
  if (authResult.statusCode) { // If authentication failed, authResult is an HTTP response
    return authResult;
  }
  const userId = authResult.userId; // Extract userId from the authenticated payload

  const sql = neon();
  console.log(`Received request to log browser IP for user_id: ${userId}`);

  try {
    const clientIpDetails = JSON.parse(event.body);

    if (!clientIpDetails || !clientIpDetails.ip) {
      throw new Error("Invalid or missing IP details in request body.");
    }

    // Get the most recent IP log for THIS USER from our database
    const lastLogResult = await sql`SELECT ip FROM ip_logs WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 1`;
    const lastLoggedIp = lastLogResult.length > 0 ? lastLogResult[0].ip : null;

    // Compare the received client IP with the last logged IP for this user
    if (clientIpDetails.ip !== lastLoggedIp) {
      console.log(`Browser IP change detected for user ${userId}. Old: ${lastLoggedIp || 'None'}, New: ${clientIpDetails.ip}. Logging.`);

      const currentTimestamp = new Date().toISOString();

      // Insert the new browser IP into the ip_logs table, linked to the user
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
    console.error('Error in log-browser-ip function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message || 'Unknown error occurred.'}` }) };
  }
}
