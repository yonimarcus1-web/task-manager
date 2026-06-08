@echo off
echo מפעיל את מנהל הפרויקטים...
start "" http://localhost:3000
npm run dev -- --hostname 0.0.0.0
