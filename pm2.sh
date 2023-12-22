#!/bin/bash
# How to run the app via PM2 (https://www.npmjs.com/package/pm2)
sudo pm2 start --name saccharose ./dist/backend/server.js --node-args="--max-old-space-size=4096"