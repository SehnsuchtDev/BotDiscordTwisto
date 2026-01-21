import {SlashCommandBuilder, MessageFlags, Events} from 'discord.js';
import { getJsonFromFile, saveJsonToFile } from "../Controllers/FileController.js";
import { getChannel } from '../Tools/discord.js';

const fileName = "channelsWithListener.json"
let listenerList = [];

export const command = {
    data : new SlashCommandBuilder()
            .setName('courses')
            .setDescription('Gère la liste de courses')
            .addSubcommand(subcommand => 
                subcommand.setName('start')
                    .setDescription('Écoute les nouveaux messages du salon et réagit avec un emoji de suppression'))
            .addSubcommand(subcommand => 
                subcommand.setName('stop')
                    .setDescription('Arrête l\'écoute')),
    async execute(interaction) {
        await interaction.deferReply();

        let message = "";
        const channel = interaction.channel ? interaction.channel : interaction.user;

        console.log("command channel id: " + (interaction.channel ? interaction.channel.id : null), interaction.user ? interaction.user.id : null);

        switch (interaction.options.getSubcommand()) {
            case "start":
                message = await setGroceriesListener(channel);
                break;
            case "stop":
                message = await stopGroceriesListener(channel);
                break;
        }

        if (message !== "")
        {
            await interaction.editReply({content: message, flags : MessageFlags.Ephemeral});
        }
        else
        {
            interaction.cancelReply();
        }
    }
}

export const reload = async (client) => {
    listenerList = await getJsonFromFile(fileName);

    for (let channelId of listenerList)
    {
        let channel = await getChannel(client, channelId);

        if (channel == null)
        {
            continue;
        }

        setGroceriesListener(channel, true);
    }

    // launch listener
    // add emoji reaction to new messages
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const channelId = message.channel ? message.channel.id : message.client.id;
        if (!listenerList.includes(channelId)) return;

        message.react('❌');
    });

    // delete reacted message
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        console.log('allo')
        // When a reaction is received, check if the structure is partial
        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            try {
                reaction = await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }
        if (user.bot) return;

        const message = reaction.message;
        const channelId = message.channel ? message.channel.id : message.client.id;

        if (!listenerList.includes(channelId)) return;
        if (!message.author.id === client.user.id) return;
        if (reaction.emoji.name !== '❌') return;

        message.delete();
    });
}

const setGroceriesListener = async (channel, fromReload = false) =>
{
    let message = "";

    if (!fromReload)
    {
        // add channel to list
        listenerList.push(channel.id);
        const listenerListJson = JSON.parse(JSON.stringify(listenerList));
        await saveJsonToFile(listenerListJson, fileName);
        message = `La commande d'écoute des nouveaux messages a été démarrée dans le salon.`;
    }
    
    return message;
}

const stopGroceriesListener = async (channel) =>
{
    if (listenerList.includes(channel.id))
    {
        // stop listener

        // delete from list
        const index = listenerList.indexOf(channel.id);
        delete listenerList[index];
        const listenerListJson = JSON.parse(JSON.stringify(listenerList));
        await saveJsonToFile(listenerListJson, fileName);
    }

    else
    {
        return "La commande d'écoute des nouveaux messages n'était pas active.";
    }


    return "La commande d'écoute des nouveaux messages ne sera plus répétée.";
}