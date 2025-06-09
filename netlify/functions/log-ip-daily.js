
// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-ip-daily.js
// PURPOSE: A scheduled function (@daily) to automatically log IP details.
// VERSION: 5.0 (Using Undici for stability)
// -----------------------------------------------------------------------------

import { neon } from '@netlify/neon';
import { fetch } from 'undici';

export async function handler() {
  const sql = neon();
  console.log('Running daily IP log task...');

  try {
    const response = await fetch('https://ipinfo.io/json');
    if (!response.ok) throw new Error(`IPinfo fetch failed with status: ${response.status}`);
    const ipDetails = await response.json();

    if (!ipDetails || !ipDetails.ip) {
        throw new Error("Failed to fetch valid IP details from ipinfo.io");
    }

    await sql`
      INSERT INTO ip_logs (ip, hostname, city, region, country, loc, org, postal, timezone)
      VALUES (${ipDetails.ip}, ${ipDetails.hostname}, ${ipDetails.city}, ${ipDetails.region}, ${ipDetails.country}, ${ipDetails.loc}, ${ipDetails.org}, ${ipDetails.postal}, ${ipDetails.timezone})
    `;

    console.log('Successfully logged new IP details:', ipDetails.ip);
    return { statusCode: 200, body: JSON.stringify({ message: 'IP log successful' }) };
  } catch (error) {
    console.error('Error in scheduled function log-ip-daily:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

