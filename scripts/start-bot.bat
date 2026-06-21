@echo off
REM WhyMan Discord Bot — starts on login / scheduled
REM Runs at startup via Windows Task Scheduler (trigger: At log on)

cd /d "c:\Users\trdyp\OneDrive\Desktop\MYWORLD\Projects\radetch"
node scripts\discord-bot.js >> logs\bot.log 2>&1
