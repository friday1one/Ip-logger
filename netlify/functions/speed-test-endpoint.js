// -----------------------------------------------------------------------------
// FILE: netlify/functions/speed-test-endpoint.js
// PURPOSE: An endpoint for the frontend to POST data to for the upload speed test.
// It accepts the data and immediately returns success without processing it.
// -----------------------------------------------------------------------------

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Upload received.' })
    };
}
