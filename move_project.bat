@echo off
echo Starting Robocopy exclude node_modules...
mkdir "C:\Users\bhagy\HaritSwaraj" 2>nul

robocopy "%~dp0." "C:\Users\bhagy\HaritSwaraj" /MIR /XD node_modules .git /R:1 /W:1 /NP /NFL /NDL

if %errorlevel% leq 7 (
    echo Robocopy finished successfully (Code %errorlevel%).
    exit /b 0
) else (
    echo Robocopy failed with error code %errorlevel%.
    exit /b %errorlevel%
)
