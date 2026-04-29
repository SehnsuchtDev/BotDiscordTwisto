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
    reactToSimon(client);
}

const simonTag = "369908822514466816";

const messageList = [
    `<@${simonTag}> Gros puceau de merde`,
    "Marie... Reviens... BIENTÔT",
    `<@${simonTag}> more like Simerde`,
    `Je préfèrerais aller à l'hôtel des Quatrans... <@${simonTag}>`,
    `Tu ressembles à Jacky <@${simonTag}>`,
    `Tu serais jamais capable de mettre un knee <@${simonTag}>`,
    `<@${simonTag}> Va t'faire enculer, va bien t'faire enculer, salope`,
    `Tu crois que t'es un tigre mais en fait t'es <@${simonTag}>`,
    "J'ai mis 5/10 à OoT sur Senscritique",
    "Martin Scorsixseven et ses deux bons films dans sa carrière !!",
    `Tu m'en roules une <@${simonTag}> ?`,
    "J'aime trooooooop Xenobladeeeeeee",
    `<@${simonTag}> On peut venir chez toi ?`,
    `<@${simonTag}> C'est ouvert chez toi ?`,
    `<@${simonTag}> On arrive à l'hôtel`,
    `<@${simonTag}> t'es un putain d'abruti`,
    `<@${simonTag}> je vais péter ta chicha`,
    `<@${simonTag}> tu me dois 200€`,
];

const sendMessage = (channel) =>
{
    let timeout = Math.round(Math.random() * (3.6e+6 - 8.64e+7)) + 8.64e+7; 
    console.log(timeout)
    setTimeout(() => {
        let message = messageList[Math.floor(Math.random() * messageList.length)];
        channel.send(message);
        sendMessage(channel);
    }, timeout);
}

const reactToSimon = (client) =>
{
    client.on('messageCreate', (message) => {
        if (message.author.id === simonTag)
        {
            message.react("<:fils:1403871692178325567>");
            message.react("<:jesus:1404590623583113397>");
        }
    });
}