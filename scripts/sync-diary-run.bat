@echo off
cd /d "C:\Users\trdyp\OneDrive\Desktop\MYWORLD\BRAIN\02-Projects\radetch"
node_modules\.bin\tsx.cmd scripts\sync-diary.ts --once >> scripts\sync.log 2>&1
