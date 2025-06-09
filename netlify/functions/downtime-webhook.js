// -----------------------------------------------------------------------------
// FILE: netlify/functions/downtime-webhook.js
// PURPOSE: Receives webhook notifications and logs them to Netlify DB.
//          This function is NOT protected by authentication, as webhooks
//          typically come from external services without a user token.
// VERSION: 4.0 (Robust Connection Handling - FRESH COPY)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';

export async function handler(event) {
  // Ensure only POST requests are allowed for webhooks.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sql = neon(); // Initialize Neon client.

  try {
    // Parse the webhook payload.
    const payload = JSON.parse(event.body);

    // Determine the event type (UP/DOWN) and construct details from the payload.
    // This assumes a payload structure from a typical uptime monitoring service.
    const eventType = payload?.data?.attributes?.status === "up" ? "UP" : "DOWN";
    const details = `Monitor: ${payload?.data?.attributes?.monitor_group_name || 'N/A'} - ${payload?.data?.attributes?.url || 'N/A'}. Cause: ${payload?.data?.attributes?.cause || 'N/A'}`;}

    // IMPORTANT: If downtime events are meant to be tied to a specific user,
    // you would need to find a way to pass the userId from the webhook sender,
    // which is often complex. For simplicity, this function assumes the
    // webhook logs global downtime, or you would add a default user_id.
    // This example still includes user_id in the insert, but it would need to be populated.
    // For a simple global log, you might remove user_id from this insert and table.

    if (eventType) {
        // Insert the downtime event into the database.
        // Assuming user_id might be null or you have a mechanism to map it.
        // If downtime events are global, remove user_id from the insert statement
        // and from your downtime_events table schema.
        await sql`
            INSERT INTO downtime_events (event_type, details, timestamp, user_id)
            VALUES (${eventType}, ${details}, NOW(), ${null}) -- Set user_id to null or a default if global
        `;
    }

    // Return success response.
    return { statusCode: 200, body: JSON.stringify({ message: 'Webhook received and processed' }) };
  } catch (error) {
    // Log any errors and return a 500 Internal Server Error response.
    console.error('Error in downtime-webhook function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
