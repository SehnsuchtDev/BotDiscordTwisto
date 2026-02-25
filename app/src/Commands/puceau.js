import { time } from 'console';
import { channel } from 'diagnostics_channel';
import {SlashCommandBuilder} from 'discord.js';
import { configDotenv } from 'dotenv';

export const command = {};

export const reload = async (client) => {
    let channelId = process.env.LOOP_CHANNEL_ID;
    let channel = client.channels.cache.get(channelId);

    if (channel == null)
    {
        console.error(`Channel with id ${channelId} not found`);
        return;
    }

    sendMessage(channel);
}

const sendMessage = (channel) =>
{
    let timeout = Math.round(Math.random() * (3.6e+6 - 8.64e+7)) + 8.64e+7; 
    console.log(timeout)
    setTimeout(() => {
        let message = "<@369908822514466816> Gros puceau de merde"
        channel.send(message);
        sendMessage(channel);
    }, timeout);
}