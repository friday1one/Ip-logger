
// -----------------------------------------------------------------------------
// FILE: netlify/functions/save-speed-test.js
// PURPOSE: Saves a new speed test result to Netlify DB.
// VERSION: 4.0 (Robust Connection Handling)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const sql = neon();

  try {
    const data = JSON.parse(event.body);
    
    await sql`
      INSERT INTO speed_tests (download_mbps, upload_mbps, latency_ms)
      VALUES (${data.download_mbps}, ${data.upload_mbps}, ${data.latency_ms})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Speed test saved successfully' }),
    };
  } catch (error) {
    console.error('Error in save-speed-test function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
    };
  }
}
