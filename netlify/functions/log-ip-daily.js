
// -----------------------------------------------------------------------------
// FILE: netlify/functions/log-ip-daily.js
// PURPOSE: A scheduled function (@daily) to automatically log IP details.
// VERSION: 2.0 (Self-contained Supabase client)
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

export async function handler() {
  console.log('Running daily IP log task...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const response = await fetch('https://ipinfo.io/json');
    if (!response.ok) throw new Error(`IPinfo fetch failed with status: ${response.status}`);
    const ipDetails = await response.json();

    if (!ipDetails || !ipDetails.ip) {
        throw new Error("Failed to fetch valid IP details from ipinfo.io");
    }

    const logData = {
        ip: ipDetails.ip, hostname: ipDetails.hostname, city: ipDetails.city,
        region: ipDetails.region, country: ipDetails.country, loc: ipDetails.loc,
        org: ipDetails.org, postal: ipDetails.postal, timezone: ipDetails.timezone,
    };
    
    const { error } = await supabase.from('ip_logs').insert([logData]);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    console.log('Successfully logged new IP details:', logData);
    return { statusCode: 200, body: JSON.stringify({ message: 'IP log successful', data: logData }) };
  } catch (error) {
    console.error('Error in scheduled function log-ip-daily:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}