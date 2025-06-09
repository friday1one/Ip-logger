/*
 * -----------------------------------------------------------------------------
 * FILE: netlify/functions/get-dashboard-data.js
 * PURPOSE: Fetches all data needed for the main dashboard view from Netlify DB.
 * This is the primary function for loading the dashboard.
 * VERSION: 6.0 (Robust and Simplified)
 * -----------------------------------------------------------------------------
 */

import { neon } from '@netlify/neon';
import { fetch } from 'undici';

export async function handler(event) {
  const sql = neon();
  const { ipRange = 'all', speedRange = 'all' } = event.queryStringParameters;

  try {
    // 1. Fetch current IP details from an external API
    const ipInfoResponse = await fetch('https://ipinfo.io/json');
    if (!ipInfoResponse.ok) throw new Error(`IPinfo fetch failed with status: ${ipInfoResponse.status}`);
    const currentIp = await ipInfoResponse.json();

    // 2. Fetch all logs and tests in parallel
    const [ipLogs, speedTests, downtimeEvents] = await Promise.all([
      sql`SELECT * FROM ip_logs ORDER BY timestamp DESC`,
      sql`SELECT * FROM speed_tests ORDER BY timestamp DESC`,
      sql`SELECT * FROM downtime_events ORDER BY timestamp DESC LIMIT 10`
    ]);
    
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
