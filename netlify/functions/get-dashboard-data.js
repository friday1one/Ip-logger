/*
 * -----------------------------------------------------------------------------
 * FILE: netlify/functions/get-dashboard-data.js
 * PURPOSE: Fetches all data needed for the main dashboard view from Netlify DB,
 * filtered by the authenticated user.
 * VERSION: 6.2 (Protected and User-Specific Data - FRESH COPY)
 * -----------------------------------------------------------------------------
 */

import { neon } from '@netlify/neon';
import { authenticate } from './utils/auth'; // Import auth helper from utils folder (relative path)

export async function handler(event) {
  // Authenticate the incoming request. If authentication fails,
  // the 'authenticate' function returns an HTTP response object (e.g., 401 Unauthorized).
  const authResult = authenticate(event);
  if (authResult.statusCode) { // Check if authResult is an HTTP response (i.e., authentication failed)
    return authResult;
  }
  // If authenticated, extract the userId from the returned payload.
  const userId = authResult.userId;

  const sql = neon(); // Initialize Neon client.

  try {
    // Fetch all logs and tests in parallel from the database,
    // ensuring they belong to the authenticated user (WHERE user_id = ${userId}).
    const [ipLogs, speedTests, downtimeEvents] = await Promise.all([
      sql`SELECT * FROM ip_logs WHERE user_id = ${userId} ORDER BY timestamp DESC`,
      sql`SELECT * FROM speed_tests WHERE user_id = ${userId} ORDER BY timestamp DESC`,
      // Downtime events are typically global or monitor-specific. If they are
      // associated with a user, the WHERE clause is appropriate.
      sql`SELECT * FROM downtime_events WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 20`
    ]);

    // Determine the current IP for Live Status from the latest logged IP for this user.
    // This ensures "Live Status" reflects what's in "IP History" as the current IP for the user.
    const currentIp = ipLogs.length > 0 ? ipLogs[0] : null;

    // Return all fetched data in a single JSON payload.
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
    // Log any errors and return a 500 Internal Server Error response.
    console.error('Error in get-dashboard-data function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
    };
  }
}
