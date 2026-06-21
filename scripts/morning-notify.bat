@echo off
REM WhyMan — Morning Briefing + Market Update
REM Runs daily at 06:20 via Windows Task Scheduler

cd /d "c:\Users\trdyp\OneDrive\Desktop\MYWORLD\Projects\radetch"
node scripts\discord-notify.js >> logs\notify.log 2>&1
