
// -----------------------------------------------------------------------------
// FILE: netlify/functions/save-speed-test.js
// PURPOSE: Saves a new speed test result to the database.
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
    const data = JSON.parse(event.body);
    const testResult = {
      download_mbps: data.download_mbps,
      upload_mbps: data.upload_mbps,
      latency_ms: data.latency_ms,
    };
    
    const { error } = await supabase.from('speed_tests').insert([testResult]);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Speed test saved successfully', data: testResult }),
    };
  } catch (error) {
    console.error('Error in save-speed-test function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
    };
  }
}

