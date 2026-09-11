import crypto from 'crypto';

// Use your REAL secret key here (same one set in Render's env vars)
const secretKey = process.argv[2];
if (!secretKey) {
  console.error('Usage: node gen_wrong_hash.mjs <your_secret_key>');
  process.exit(1);
}

const wrongButRealIp = '8.8.8.8'; // Google DNS — definitely not your IP
const hash = crypto.createHmac('sha256', secretKey).update(wrongButRealIp).digest('base64');
console.log('Properly-formatted WRONG hash:', hash);