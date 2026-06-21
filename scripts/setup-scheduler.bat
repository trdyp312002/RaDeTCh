@echo off
REM ================================================================
REM  WhyMan — Windows Task Scheduler Setup
REM  Run this ONCE as Administrator to register all tasks
REM ================================================================

echo Setting up WhyMan scheduled tasks...

REM Task 1: Morning Briefing + Market Update (daily 06:20)
schtasks /create /tn "WhyMan Morning Briefing" ^
  /tr "\"c:\Users\trdyp\OneDrive\Desktop\MYWORLD\Projects\radetch\scripts\morning-notify.bat\"" ^
  /sc daily /st 06:20 /f
echo [1/3] Morning Briefing task created (06:20 daily)

REM Task 2: Evening Reminder (Mon-Fri 20:00)
schtasks /create /tn "WhyMan Evening Reminder" ^
  /tr "\"c:\Users\trdyp\OneDrive\Desktop\MYWORLD\Projects\radetch\scripts\evening-notify.bat\"" ^
  /sc weekly /d MON,TUE,WED,THU,FRI /st 20:00 /f
echo [2/3] Evening Reminder task created (Mon-Fri 20:00)

REM Task 3: Discord Bot auto-start at login
schtasks /create /tn "WhyMan Discord Bot" ^
  /tr "\"c:\Users\trdyp\OneDrive\Desktop\MYWORLD\Projects\radetch\scripts\start-bot.bat\"" ^
  /sc onlogon /f
echo [3/3] Discord Bot start-on-login task created

echo.
echo ================================================================
echo  All WhyMan tasks registered! 
echo  To verify: schtasks /query /tn "WhyMan*"
echo  Logs saved to: Projects\radetch\logs\
echo ================================================================
pause
