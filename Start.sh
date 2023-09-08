#!/bin/bash

if ! command -v npm &> /dev/null; then
  echo "nvm is not installed. Installing nvm...."
  export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  source ~/.bashrc
  nvm install --lts
  nvm use --lts
fi

npm i --no-audit
npm run buildAndStart


