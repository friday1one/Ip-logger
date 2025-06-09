
// -----------------------------------------------------------------------------
// The following functions do not need Supabase, so they remain unchanged.
// FILE: netlify/functions/ping.js
// -----------------------------------------------------------------------------
export async function handler() {
    return {
        statusCode: 204, // No Content
        headers: { 'Access-Control-Allow-Origin': '*' }
    };
}