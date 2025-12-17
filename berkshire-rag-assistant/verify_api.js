
async function testEndpoint(url, method = 'GET', body = null) {
    try {
        console.log(`Testing with body keys: ${Object.keys(body)}...`);
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 300)}...`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    const url = 'http://localhost:4111/api/workflows/ragWorkflow/start-async';

    // 1. Direct input (previously failed, but retrying to be sure)
    await testEndpoint(url, 'POST', { question: "hello 1" });

    // 2. Wrapped in input
    await testEndpoint(url, 'POST', { input: { question: "hello 2" } });

    // 3. Wrapped in data
    await testEndpoint(url, 'POST', { data: { question: "hello 3" } });

    // 4. Wrapped in inputData - since the error mentioned inputData
    await testEndpoint(url, 'POST', { inputData: { question: "hello 4" } });
}

run();
