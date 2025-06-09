
// -----------------------------------------------------------------------------
// FILE: netlify/functions/downtime-webhook.js
// PURPOSE: Receives webhook notifications and logs them to Netlify DB.
// -----------------------------------------------------------------------------

import postgres from 'postgres';

const sql = postgres(process.env.NETLIFY_DATABASE_URL, { ssl: 'require' });

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);

    // Example structure for Better Stack webhook
    const eventType = payload?.data?.attributes?.status === "up" ? "UP" : "DOWN";
    const details = `Monitor: ${payload?.data?.attributes?.monitor_group_name || 'N/A'} - ${payload?.data?.attributes?.url || 'N/A'}. Cause: ${payload?.data?.attributes?.cause || 'N/A'}`;

    if (eventType) {
        await sql`
            INSERT INTO downtime_events (event_type, details)
            VALUES (${eventType}, ${details})
        `;
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Webhook received and processed' }) };
  } catch (error) {
    console.error('Error in downtime-webhook function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}

