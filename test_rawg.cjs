// test_rawg.cjs
const https = require('https');

const API_KEY = '75a71afe533f44898a8777feeec69fee';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve({ status: res.statusCode, data }); });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function runTests() {
    console.log("Testing RAWG API Endpoints...");

    const endpoints = [
        `https://api.rawg.io/api/genres?key=${API_KEY}`,
        `https://api.rawg.io/api/platforms/lists/parents?key=${API_KEY}`,
        `https://api.rawg.io/api/games?key=${API_KEY}&page=1&page_size=20&ordering=-added`
    ];

    for (const url of endpoints) {
        console.log(`\nFetching: ${url}`);
        const result = await fetchUrl(url);
        console.log(`Status: ${result.status}`);
        if (result.status !== 200) {
            console.log(`Error Response: ${result.data}`);
        } else {
            console.log(`Success, length: ${result.data.length}`);
        }
    }
}

runTests();
