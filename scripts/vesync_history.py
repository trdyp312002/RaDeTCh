"""
Fetch historical weight records from VeSync smart scale (pyvesync 3.x async API).
Outputs JSON: {"records": [{"date": "YYYY-MM-DD", "weight": 70.5, "bmi": 22.1}, ...]}
"""
import sys, json, os, asyncio

def out(data):
    print(json.dumps(data), flush=True)

async def main():
    email    = os.environ.get("VESYNC_EMAIL", "")
    password = os.environ.get("VESYNC_PASSWORD", "")
    if not email or not password:
        out({"error": "Missing VESYNC_EMAIL or VESYNC_PASSWORD"}); sys.exit(1)

    try:
        from pyvesync import VeSync
    except ImportError:
        out({"error": "pyvesync not installed"}); sys.exit(1)

    try:
        manager = VeSync(email, password, time_zone="Asia/Bangkok")
        if not await manager.login():
            out({"error": "Login failed"}); sys.exit(1)

        await manager.update()
        scales = getattr(manager, "scales", []) or []
        if not scales:
            out({"error": "No scale device found"}); sys.exit(1)

        scale = scales[0]

        # Try to get recent records list
        records_raw = (
            getattr(scale, "recent_records", None)
            or getattr(scale, "records", None)
            or []
        )

        records = []
        if records_raw:
            for rec in records_raw:
                date_val   = rec.get("date") or rec.get("measureTime") or rec.get("measure_time")
                weight_val = rec.get("weight") or rec.get("bWeight")
                bmi_val    = rec.get("bmi")
                fat_val    = rec.get("body_fat") or rec.get("bFat")
                if not date_val or not weight_val:
                    continue
                date_str = str(date_val)[:10].replace("/", "-")
                records.append({
                    "date":     date_str,
                    "weight":   round(float(weight_val), 2),
                    "bmi":      round(float(bmi_val), 1) if bmi_val else None,
                    "body_fat": round(float(fat_val),  1) if fat_val else None,
                })
        else:
            # Fallback: return today's latest reading only
            try:
                await scale.get_details()
            except Exception:
                pass
            weight = getattr(scale, "weight", None)
            if weight is not None:
                from datetime import date
                records.append({
                    "date":     date.today().isoformat(),
                    "weight":   round(float(weight), 2),
                    "bmi":      round(float(getattr(scale, "bmi", 0) or 0), 1) or None,
                    "body_fat": round(float(getattr(scale, "body_fat", 0) or 0), 1) or None,
                })

        out({"records": records, "device": getattr(scale, "device_name", None)})

    except SystemExit:
        raise
    except Exception as e:
        out({"error": str(e)}); sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
