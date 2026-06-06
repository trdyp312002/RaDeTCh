const { GarminConnect } = require('garmin-connect');

async function main() {
    try {
        const email = process.env.GARMIN_EMAIL || process.env.GARMIN_USERNAME;
        const password = process.env.GARMIN_PASSWORD;
        if (!email || !password) {
            console.log("No credentials provided.");
            return;
        }

        const gcClient = new GarminConnect();
        await gcClient.login(email, password);
        console.log("Logged in!");

        const today = new Date();
        const sleep = await gcClient.getSleepData(today);
        console.log("Sleep:", JSON.stringify(sleep, null, 2).slice(0, 500));

        const steps = await gcClient.getSteps(today);
        console.log("Steps:", JSON.stringify(steps, null, 2).slice(0, 500));

        const hr = await gcClient.getHeartRate(today);
        console.log("HR:", JSON.stringify(hr, null, 2).slice(0, 500));
    } catch (e) {
        console.error(e);
    }
}
main();
