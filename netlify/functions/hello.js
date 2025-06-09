
// -----------------------------------------------------------------------------
// FILE: netlify/functions/hello.js
// PURPOSE: Simple test function. Can be kept for debugging or deleted.
// -----------------------------------------------------------------------------
export async function handler() {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Hello from your test function v2!' }),
    };
}
