
// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-ip-on-demand.js
// PURPOSE: Checks the current IP against the last logged IP and saves a new
// log only if there has been a change. Triggered by the user.
// VERSION: 1.0
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { fetch } from 'undici';

export async function handler() {
  const sql = neon();
  console.log('Running on-demand IP check...');

  try {
    // Get the most recent IP log from our database
    const lastLogResult = await sql`SELECT ip FROM ip_logs ORDER BY timestamp DESC LIMIT 1`;
    const lastLoggedIp = lastLogResult.length > 0 ? lastLogResult[0].ip : null;

    // Get the current live IP
    const ipInfoResponse = await fetch('https://ipinfo.io/json');
    if (!ipInfoResponse.ok) throw new Error(`IPinfo fetch failed: ${ipInfoResponse.status}`);
    const currentIpDetails = await ipInfoResponse.json();
    
    if (!currentIpDetails || !currentIpDetails.ip) {
      throw new Error("Failed to fetch valid current IP details.");
    }

    // Compare and log ONLY if the IP has changed
    if (currentIpDetails.ip !== lastLoggedIp) {
      console.log(`IP change detected. Old: ${lastLoggedIp}, New: ${currentIpDetails.ip}. Logging.`);
      await sql`
        INSERT INTO ip_logs (ip, hostname, city, region, country, loc, org, postal, timezone)
        VALUES (${currentIpDetails.ip}, ${currentIpDetails.hostname}, ${currentIpDetails.city}, ${currentIpDetails.region}, ${currentIpDetails.country}, ${currentIpDetails.loc}, ${currentIpDetails.org}, ${currentIpDetails.postal}, ${currentIpDetails.timezone})
      `;
      return { statusCode: 200, body: JSON.stringify({ message: 'New IP logged successfully.' }) };
    } else {
      console.log('IP has not changed. No new log created.');
      return { statusCode: 200, body: JSON.stringify({ message: 'IP has not changed.' }) };
    }

  } catch (error) {
    console.error('Error in on-demand IP log function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}