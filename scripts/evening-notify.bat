@echo off
REM WhyMan — Evening Reminder (weekdays 20:00)
REM Runs Mon-Fri at 20:00 via Windows Task Scheduler

cd /d "c:\Users\trdyp\OneDrive\Desktop\MYWORLD\Projects\radetch"
node scripts\discord-notify.js --evening >> logs\notify.log 2>&1
