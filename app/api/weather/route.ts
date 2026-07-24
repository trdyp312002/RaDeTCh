import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(){
  try{
    const latitude=process.env.WEATHER_LATITUDE||"35.6762";
    const longitude=process.env.WEATHER_LONGITUDE||"139.6503";
    const url=new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",latitude);url.searchParams.set("longitude",longitude);
    url.searchParams.set("daily","weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("timezone","Asia/Tokyo");url.searchParams.set("forecast_days","3");
    const response=await fetch(url,{next:{revalidate:1800}});if(!response.ok)throw new Error("weather");
    const data=await response.json();
    return NextResponse.json({location:"Tokyo",days:data.daily.time.map((date:string,i:number)=>({date,code:data.daily.weather_code[i],max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],rain:data.daily.precipitation_probability_max[i]??0}))});
  }catch(error){console.error("Weather dashboard:",error);return NextResponse.json({location:"Tokyo",days:[]},{status:502})}
}
