require('dotenv').config({ path: '.env.local' });
const { GarminConnect } = require('garmin-connect');
const fs = require('fs/promises');
const path = require('path');

const dataFilePath = path.join(__dirname, 'data', 'health.json');
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // Check every 4 hours

async function syncGarmin() {
    try {
        console.log(`\n[${new Date().toLocaleString()}] Starting Garmin Background Auto-Sync...`);
        const email = process.env.GARMIN_EMAIL;
        const password = process.env.GARMIN_PASSWORD;

        if (!email || !password) {
            console.error("Missing GARMIN_EMAIL or GARMIN_PASSWORD in .env.local");
            return;
        }

        const client = new GarminConnect({ username: email, password: password });
        await client.login();

        const today = new Date();
        const sleep = await client.getSleepData(today);
        const steps = await client.getSteps(today);
        const hr = await client.getHeartRate(today);

        const sleepSeconds = sleep?.dailySleepDTO?.sleepTimeSeconds || 0;
        const sleepHours = sleepSeconds ? parseFloat((sleepSeconds / 3600).toFixed(2)) : null;
        const sleepScore = sleep?.dailySleepDTO?.sleepScores?.overall?.value || null;

        let totalSteps = null;
        if (Array.isArray(steps) && steps.length > 0) {
            totalSteps = steps.reduce((acc, curr) => acc + (curr.steps || 0), 0);
        }

        let restingHR = null;
        if (hr && hr.restingHeartRate) {
            restingHR = hr.restingHeartRate;
        }

        // Read existing data
        let data = { logs: [] };
        try {
            const fileContents = await fs.readFile(dataFilePath, "utf8");
            data = JSON.parse(fileContents);
        } catch(e) {
            // File might not exist yet
            console.log("Creating new health database file...");
        }

        // Check if we already synced today
        const dateStr = today.toISOString().split("T")[0];
        const alreadySyncedToday = data.logs.find(l => l.date.startsWith(dateStr) && l.notes === "Garmin Auto-Sync");

        if (alreadySyncedToday) {
            console.log(`Already synced Garmin data for today (${dateStr}). Skipping.`);
            return;
        }

        const newLog = {
            id: Date.now().toString(),
            date: today.toISOString().replace('T', ' ').substring(0, 19),
            weight: null,
            sleep_hours: sleepHours,
            sleep_score: sleepScore,
            steps: totalSteps,
            resting_heart_rate: restingHR,
            calories_in: null,
            calories_out: null,
            notes: "Garmin Auto-Sync"
        };

        data.logs.push(newLog);
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
        console.log(`[${new Date().toLocaleString()}] Successfully saved Garmin data to database!`);

    } catch (err) {
        console.error("Garmin Sync Error:", err.message);
    }
}

console.log("Garmin Auto-Sync Background Bot Started!");
console.log("Press Ctrl+C to stop.");

// Run immediately, then every X hours
syncGarmin();
setInterval(syncGarmin, CHECK_INTERVAL);
