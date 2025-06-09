/*
 * -----------------------------------------------------------------------------
 * FILE: netlify/functions/get-dashboard-data.js
 * PURPOSE: Fetches all data needed for the main dashboard view from Netlify DB.
 * This is the primary function for loading the dashboard.
 * VERSION: 6.2 (Protected and User-Specific Data)
 * -----------------------------------------------------------------------------
 */

import { neon } from '@netlify/neon';
import { authenticate } from '../utils/auth'; // Import auth helper

export async function handler(event) {
  const authResult = authenticate(event); // Authenticate the request
  if (authResult.statusCode) { // If authentication failed, authResult is an HTTP response
    return authResult;
  }
  const userId = authResult.userId; // Extract userId from the authenticated payload

  const sql = neon();

  try {
    // 1. Fetch user-specific IP logs, speed tests, and downtime events in parallel
    const [ipLogs, speedTests, downtimeEvents] = await Promise.all([
      sql`SELECT * FROM ip_logs WHERE user_id = ${userId} ORDER BY timestamp DESC`,
      sql`SELECT * FROM speed_tests WHERE user_id = ${userId} ORDER BY timestamp DESC`,
      sql`SELECT * FROM downtime_events WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 20`
    ]);

    // Determine the current IP for Live Status from the latest logged IP for this user
    const currentIp = ipLogs.length > 0 ? ipLogs[0] : null;

    // Return all data in a single payload
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentIp,        // The most recent logged IP from this user's DB for "Live Status"
        ipLogs,           // All IP logs for this user for "IP History"
        speedTests,       // All speed tests for this user for "Speed History" chart
        downtimeEvents,   // Recent downtime events for this user
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
