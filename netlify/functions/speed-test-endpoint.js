
// -----------------------------------------------------------------------------
// FILE: netlify/functions/speed-test-endpoint.js
// -----------------------------------------------------------------------------
export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Upload received.' })
    };
}
