
// -----------------------------------------------------------------------------
// FILE: netlify/functions/downtime-webhook.js
// PURPOSE: Receives webhook notifications from an uptime monitor service.
// VERSION: 2.0 (Self-contained Supabase client)
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = JSON.parse(event.body);
    const eventType = payload.data.attributes.status === "up" ? "UP" : "DOWN";
    const details = `Monitor: ${payload.data.attributes.monitor_group_name} - ${payload.data.attributes.url}. Cause: ${payload.data.attributes.cause}`;

    const { error } = await supabase.from('downtime_events').insert([{ event_type: eventType, details: details }]);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    return { statusCode: 200, body: JSON.stringify({ message: 'Webhook received and processed' }) };
  } catch (error) {
    console.error('Error in downtime-webhook function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }) };
  }
}
