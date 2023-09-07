pushd %~dp0
call npm install --no-audit
npm run buildAndStart
pause
popd