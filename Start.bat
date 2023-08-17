pushd %~dp0
call npm install --no-audit
call tsc
node build/index.js
pause
popd