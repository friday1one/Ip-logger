
// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-ip-daily.js
// PURPOSE: A scheduled function (@daily) to automatically log IP details.
// -----------------------------------------------------------------------------

import { supabase } from './_supabase-client.js';
import fetch from 'node-fetch';

export async function handler() {
  console.log('Running daily IP log task...');

  try {
    // Get IP details from ipinfo.io
    const response = await fetch('https://ipinfo.io/json');
    const ipDetails = await response.json();

    if (!ipDetails || !ipDetails.ip) {
        throw new Error("Failed to fetch valid IP details from ipinfo.io");
    }

    // Prepare data object for Supabase, ensuring all columns are present
    const logData = {
        ip: ipDetails.ip,
        hostname: ipDetails.hostname,
        city: ipDetails.city,
        region: ipDetails.region,
        country: ipDetails.country,
        loc: ipDetails.loc,
        org: ipDetails.org,
        postal: ipDetails.postal,
        timezone: ipDetails.timezone,
    };
    
    // Insert the new log into the 'ip_logs' table
    const { error } = await supabase.from('ip_logs').insert([logData]);

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    console.log('Successfully logged new IP details:', logData);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'IP log successful', data: logData }),
    };
  } catch (error) {
    console.error('Error in scheduled function log-ip-daily:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
