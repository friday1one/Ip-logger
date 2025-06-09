    // -----------------------------------------------------------------------------
    // FILE: netlify/functions/test-function.js
    // PURPOSE: A very simple function to test if functions are deploying at all.
    // -----------------------------------------------------------------------------

    export async function handler(event) {
      return {
        statusCode: 200,
        body: `Hello from Netlify Test Function! Method: ${event.httpMethod}`,
      };
    }
    