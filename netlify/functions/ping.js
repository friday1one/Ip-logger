// -----------------------------------------------------------------------------
// FILE: netlify/functions/ping.js
// PURPOSE: A simple endpoint for the frontend to hit for latency tests.
// It does nothing but return a success response as quickly as possible.
// -----------------------------------------------------------------------------

export async function handler() {
    return {
        statusCode: 204, // No Content
    };
}
