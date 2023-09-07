#!/bin/bash

if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Installing npm..."
  sudo apt-get install -y npm
fi

npm install --no-audit
npm run buildAndStart