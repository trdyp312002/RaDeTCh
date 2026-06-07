"""
Fetch latest weight from VeSync smart scale (pyvesync 3.x async API).
Outputs a single JSON line to stdout.
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
        out({"error": "pyvesync not installed. Run: pip install pyvesync"}); sys.exit(1)

    try:
        manager = VeSync(email, password, time_zone="Asia/Bangkok")
        ok = await manager.login()
        if not ok:
            out({"error": "Login failed — check VESYNC_EMAIL / VESYNC_PASSWORD"}); sys.exit(1)

        await manager.update()

        scales = getattr(manager, "scales", []) or []

        # Fallback: scan other device lists for scale-like devices
        if not scales:
            for attr in ("fans", "bulbs", "outlets", "switches", "air_purifiers"):
                for d in getattr(manager, attr, []) or []:
                    dtype = (getattr(d, "device_type", "") or "").upper()
                    if dtype.startswith("CS") or "SCALE" in dtype:
                        scales.append(d)

        if not scales:
            all_types = []
            for attr in ("fans", "bulbs", "outlets", "switches", "scales", "air_purifiers"):
                for d in getattr(manager, attr, []) or []:
                    all_types.append(getattr(d, "device_type", "?"))
            out({"error": "No scale device found", "found_device_types": all_types}); sys.exit(1)

        scale = scales[0]
        try:
            await scale.get_details()
        except Exception:
            pass

        weight   = getattr(scale, "weight",    None)
        bmi      = getattr(scale, "bmi",       None)
        body_fat = getattr(scale, "body_fat",  None)

        if weight is None:
            out({"error": "Scale found but weight is None — no recent measurement?",
                 "device": getattr(scale, "device_name", "?")}); sys.exit(1)

        out({
            "weight":   round(float(weight), 2),
            "bmi":      round(float(bmi), 1)      if bmi      is not None else None,
            "body_fat": round(float(body_fat), 1) if body_fat is not None else None,
            "device":   getattr(scale, "device_name", None),
        })

    except SystemExit:
        raise
    except Exception as e:
        out({"error": str(e)}); sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
