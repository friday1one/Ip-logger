export async function handler() {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello, function is working!" }),
    };
}