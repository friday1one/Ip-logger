
// -----------------------------------------------------------------------------
// The following functions do not need a database, so they remain simple.
// FILE: netlify/functions/ping.js
// -----------------------------------------------------------------------------
export async function handler() {
    return {
        statusCode: 204, // No Content
    };
}
