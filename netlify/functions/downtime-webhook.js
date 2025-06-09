
// -----------------------------------------------------------------------------
// FILE: netlify/functions/downtime-webhook.js
// PURPOSE: Receives webhook notifications from an uptime monitor service.
// -----------------------------------------------------------------------------

import { supabase } from './_supabase-client.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // The structure of the webhook payload depends on the service (e.g., Better Stack)
    // You may need to adjust this parsing based on the specific service you choose.
    const payload = JSON.parse(event.body);

    // Example for Better Stack: Extract relevant info
    const eventType = payload.data.attributes.status === "up" ? "UP" : "DOWN";
    const details = `Monitor: ${payload.data.attributes.monitor_group_name} - ${payload.data.attributes.url}. Cause: ${payload.data.attributes.cause}`;

    const { error } = await supabase.from('downtime_events').insert([
        { event_type: eventType, details: details }
    ]);

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook received and processed' }),
    };
  } catch (error) {
    console.error('Error in downtime-webhook function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
    };
  }
}
