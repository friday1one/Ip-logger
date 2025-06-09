/*
 * -----------------------------------------------------------------------------
 * FILE: netlify/functions/get-dashboard-data.js
 * PURPOSE: Fetches all data needed for the main dashboard view.
 * It handles filtering based on query parameters.
 * -----------------------------------------------------------------------------
 */

import { supabase } from './_supabase-client.js';
import fetch from 'node-fetch';

export async function handler(event) {
  // Get query parameters for filtering
  const { ipRange = '7', speedRange = '7' } = event.queryStringParameters;

  try {
    // 1. Fetch current IP details from an external API
    const ipInfoResponse = await fetch('https://ipinfo.io/json');
    const currentIp = await ipInfoResponse.json();

    // 2. Fetch IP logs from Supabase based on the requested range
    let ipLogsQuery = supabase
      .from('ip_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (ipRange !== 'all') {
      const days = parseInt(ipRange, 10);
      const date = new Date();
      date.setDate(date.getDate() - days);
      ipLogsQuery = ipLogsQuery.gte('timestamp', date.toISOString());
    }

    // 3. Fetch speed tests from Supabase based on the requested range
    let speedTestsQuery = supabase
      .from('speed_tests')
      .select('*')
      .order('timestamp', { ascending: false });

    if (speedRange !== 'all') {
      const days = parseInt(speedRange, 10);
      const date = new Date();
      date.setDate(date.getDate() - days);
      speedTestsQuery = speedTestsQuery.gte('timestamp', date.toISOString());
    }
    
    // 4. Fetch the last 10 downtime events
    const downtimeEventsQuery = supabase
      .from('downtime_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    // Execute all database queries in parallel
    const [ipLogsResult, speedTestsResult, downtimeEventsResult] = await Promise.all([
      ipLogsQuery,
      speedTestsQuery,
      downtimeEventsQuery
    ]);
    
    // Check for errors in each query result
    if (ipLogsResult.error) throw new Error(`Supabase error (ip_logs): ${ipLogsResult.error.message}`);
    if (speedTestsResult.error) throw new Error(`Supabase error (speed_tests): ${speedTestsResult.error.message}`);
    if (downtimeEventsResult.error) throw new Error(`Supabase error (downtime_events): ${downtimeEventsResult.error.message}`);
    
    // Return all data in a single payload
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentIp,
        ipLogs: ipLogsResult.data,
        speedTests: speedTestsResult.data,
        downtimeEvents: downtimeEventsResult.data,
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