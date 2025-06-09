/*
 * -----------------------------------------------------------------------------
 * FILE: netlify/functions/get-dashboard-data.js
 * PURPOSE: Fetches all data needed for the main dashboard view from Netlify DB.
 * -----------------------------------------------------------------------------
 */

import postgres from 'postgres';
import fetch from 'node-fetch';

// The NETLIFY_DATABASE_URL is automatically provided by Netlify's build process.
const sql = postgres(process.env.NETLIFY_DATABASE_URL, { ssl: 'require' });

export async function handler(event) {
  // Get query parameters for filtering
  const { ipRange = '7', speedRange = '7' } = event.queryStringParameters;

  try {
    // 1. Fetch current IP details from an external API
    const ipInfoResponse = await fetch('https://ipinfo.io/json');
    if (!ipInfoResponse.ok) throw new Error(`IPinfo fetch failed with status: ${ipInfoResponse.status}`);
    const currentIp = await ipInfoResponse.json();

    // 2. Fetch IP logs from Netlify DB based on the requested range
    let ipLogs;
    if (ipRange === 'all') {
      ipLogs = await sql`SELECT * FROM ip_logs ORDER BY timestamp DESC`;
    } else {
      const days = parseInt(ipRange, 10);
      ipLogs = await sql`
        SELECT * FROM ip_logs 
        WHERE timestamp >= NOW() - INTERVAL '1 day' * ${days}
        ORDER BY timestamp DESC
      `;
    }

    // 3. Fetch speed tests from Netlify DB based on the requested range
    let speedTests;
    if (speedRange === 'all') { // Though the UI doesn't have 'all' for speed, we support it.
        speedTests = await sql`SELECT * FROM speed_tests ORDER BY timestamp DESC`;
    } else {
        const days = parseInt(speedRange, 10);
        speedTests = await sql`
            SELECT * FROM speed_tests
            WHERE timestamp >= NOW() - INTERVAL '1 day' * ${days}
            ORDER BY timestamp DESC
        `;
    }
    
    // 4. Fetch the last 10 downtime events
    const downtimeEvents = await sql`
      SELECT * FROM downtime_events 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    
    // Return all data in a single payload
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentIp,
        ipLogs,
        speedTests,
        downtimeEvents,
      }),
    };
  } catch (error) {
    console.error('Error in get-dashboard-data function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
    };
  }
}