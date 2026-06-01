const { GarminConnect } = require("garmin-connect");
const fs = require("fs");
const path = require("path");

async function main() {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;

  if (!email || !password) {
    console.error("Missing GARMIN_EMAIL or GARMIN_PASSWORD");
    process.exit(1);
  }

  try {
    const client = new GarminConnect({ username: email, password: password });
    await client.login();

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

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

    const dataFilePath = path.join(__dirname, "..", "data", "health.json");
    let healthData = { logs: [] };
    
    if (fs.existsSync(dataFilePath)) {
      healthData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    }

    // Check if we already have an entry for today from Garmin Auto-Sync
    let existingIndex = healthData.logs.findIndex(log => 
      log.date.startsWith(dateStr) && log.notes === "Garmin Auto-Sync"
    );

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: null,
      sleep_hours: sleepHours,
      sleep_score: sleepScore,
      steps: totalSteps,
      resting_heart_rate: restingHR,
      calories_in: null,
      calories_out: null, 
      notes: "Garmin Auto-Sync",
      image_url: null,
    };

    if (existingIndex >= 0) {
      // Update existing auto-sync for today
      healthData.logs[existingIndex] = { ...healthData.logs[existingIndex], ...newLog };
    } else {
      healthData.logs.push(newLog);
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(healthData, null, 2), "utf8");
    console.log(`Successfully synced Garmin data for ${dateStr}`);

  } catch (err) {
    console.error("Failed to sync Garmin data:", err.message);
    process.exit(1);
  }
}

main();
