import "dotenv/config"
import {Client, GatewayIntentBits} from 'discord.js';
import { configDotenv } from "dotenv";

configDotenv({ path: '../.env' });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const token = process.env.DISCORD_TOKEN;
const prefix = "/";

client.login(token);

client.on('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", function(message) {
  console.log(message);
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
});