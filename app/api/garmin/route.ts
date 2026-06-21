import { NextResponse } from "next/server";
import { getGarminClient } from "@/lib/garminClient";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getGarminClient();

    const today = new Date();
    
    // Fetch multiple endpoints
    const sleep = await client.getSleepData(today);
    const steps = await client.getSteps(today);
    const hr = await client.getHeartRate(today);
    
    // Garmin doesn't have a direct daily calories API exposed in this library without some trickery, 
    // but we'll try to extract what we can.
    
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

    const dateStr = today.toISOString().split("T")[0];

    const result = {
      date: dateStr,
      sleep_hours: sleepHours,
      sleep_score: sleepScore,
      steps: totalSteps,
      resting_heart_rate: restingHR,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Garmin API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch from Garmin", originalStatus: err.response?.status }, { status: 200 });
  }
}
