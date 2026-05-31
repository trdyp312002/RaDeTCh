import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "health.json");

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, "utf8");
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading health data:", error);
    return NextResponse.json({ logs: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fileContents = await fs.readFile(dataFilePath, "utf8");
    const data = JSON.parse(fileContents);

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      weight: body.weight ? Number(body.weight) : null,
      sleep_hours: body.sleep_hours ? Number(body.sleep_hours) : null,
      calories_in: body.calories_in ? Number(body.calories_in) : null,
      calories_out: body.calories_out ? Number(body.calories_out) : null,
      notes: body.notes || ""
    };

    data.logs.push(newLog);
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error("Error writing health data:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
