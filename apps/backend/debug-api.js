// using built-in fetch


async function probe(url) {
    console.log(`\nProbing ${url}...`);
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': 'Bearer mock-token' }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 500)}...`); // First 500 chars
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

async function main() {
    console.log('--- Checking Health (Expected: 200) ---');
    await probe('http://127.0.0.1:3001/api/v1/health');

    console.log('--- Checking Aftermarket (Expected: 200) ---');
    await probe('http://127.0.0.1:3001/api/v1/gartica/aftermarket/summary');

    console.log('--- Checking Capacity (Expected: 200) ---');
    await probe('http://127.0.0.1:3001/api/v1/gartica/capacity/forecast?horizon=30');

    console.log('--- Checking Customer 360 (Expected: 200) ---');
    await probe('http://127.0.0.1:3001/api/v1/gartica/customer-360');
}

main();
