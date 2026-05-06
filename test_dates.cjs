const https = require('https');
const API_KEY = '75a71afe533f44898a8777feeec69fee';

const today = new Date();
const endDate = today.toISOString().split('T')[0];
// This mutates today!
const startDate = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];

const dates = `${startDate},${endDate}`;
console.log(`Dates: ${dates}`);

const url = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=5&ordering=-added&dates=${dates}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error(err);
});
