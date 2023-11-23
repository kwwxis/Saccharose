#!/bin/bash
# How to run the app via PM2 (https://www.npmjs.com/package/pm2)
sudo pm2 start --name Saccharose ./dist/backend/server.js --node-args="--max-old-space-size=3072