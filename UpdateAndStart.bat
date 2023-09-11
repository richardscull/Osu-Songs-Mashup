@echo off
pushd %~dp0
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed on this machine. Automatic updates will not work.
    echo If you installed with a zip file, you will need to download the new zip and install it manually.
) else (
    call git pull --rebase --autostash --quiet
    if %errorlevel% neq 0 (
        echo Automatic update failed. Please check your internet connection and try again.
    )
)
call npm install --no-audit
npm run buildAndStart
pause
popd