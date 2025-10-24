#!/bin/bash
pm2 start --name sacchbot ./dist/backend/discordbot/discord-bot.js --time
