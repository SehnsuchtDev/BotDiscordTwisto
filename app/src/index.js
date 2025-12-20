import "dotenv/config"
import {Client, GatewayIntentBits, Events, SlashCommandBuilder} from 'discord.js';
import { configDotenv } from "dotenv";
import { useRoute } from "./Routers/CommandRouter.js";

configDotenv({ path: '../.env' });

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const token = process.env.DISCORD_TOKEN;
const prefix = "/";

client.login(token);

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  
  if (message.author.bot) return;
  if (!message.mentions.has(client.user.id)){
    return;
  }
  await useRoute(message.content, message.channel);
});
