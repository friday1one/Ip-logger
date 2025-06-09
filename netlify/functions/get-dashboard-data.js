/*
 * -----------------------------------------------------------------------------
 * FILE: netlify/functions/get-dashboard-data.js
 * PURPOSE: Fetches all data needed for the main dashboard view from Netlify DB.
 * VERSION: 4.0 (Robust Connection Handling)
 * -----------------------------------------------------------------------------
 */

import { neon } from '@netlify/neon';
import fetch from 'node-fetch';

export async function handler(event) {
  // Initialize the database connection inside the handler.
  // This is the most reliable pattern for serverless functions.
  const sql = neon();

  const { ipRange = '7', speedRange = '7' } = event.queryStringParameters;

  try {
    const ipInfoResponse = await fetch('https://ipinfo.io/json');
    if (!ipInfoResponse.ok) throw new Error(`IPinfo fetch failed with status: ${ipInfoResponse.status}`);
    const currentIp = await ipInfoResponse.json();

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

    let speedTests;
    if (speedRange === 'all') {
        speedTests = await sql`SELECT * FROM speed_tests ORDER BY timestamp DESC`;
    } else {
        const days = parseInt(speedRange, 10);
        speedTests = await sql`
            SELECT * FROM speed_tests
            WHERE timestamp >= NOW() - INTERVAL '1 day' * ${days}
            ORDER BY timestamp DESC
        `;
    }
    
    const downtimeEvents = await sql`
      SELECT * FROM downtime_events 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    
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
