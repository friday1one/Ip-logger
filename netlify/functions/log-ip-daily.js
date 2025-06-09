
// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-ip-daily.js
// PURPOSE: A scheduled function (@daily) to automatically log IP details to Netlify DB.
// -----------------------------------------------------------------------------

import postgres from 'postgres';
import fetch from 'node-fetch';

const sql = postgres(process.env.NETLIFY_DATABASE_URL, { ssl: 'require' });

export async function handler() {
  console.log('Running daily IP log task...');

  try {
    const response = await fetch('https://ipinfo.io/json');
    if (!response.ok) throw new Error(`IPinfo fetch failed with status: ${response.status}`);
    const ipDetails = await response.json();

    if (!ipDetails || !ipDetails.ip) {
        throw new Error("Failed to fetch valid IP details from ipinfo.io");
    }

    // Insert the new log into the 'ip_logs' table
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
