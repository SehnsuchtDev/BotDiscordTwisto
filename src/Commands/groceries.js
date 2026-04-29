import {SlashCommandBuilder, MessageFlags, Events} from 'discord.js';
import { getJsonFromFile, saveJsonToFile } from "../Controllers/FileController.js";
import { getChannel } from '../Tools/discord.js';

const listenerFileName = "channelsWithListener.json";
const groceriesFileName = "defaultGroceryLists.json";
const emoji = '❌';
let listenerList = [];
let defaultGroceriesList = {};

export const command = {
    data : new SlashCommandBuilder()
            .setName('courses')
            .setDescription('Gère la liste de courses')
            .addSubcommand(subcommand => 
                subcommand.setName('start')
                    .setDescription('Écoute les nouveaux messages du salon et réagit avec un emoji de suppression'))
            .addSubcommand(subcommand => 
                subcommand.setName('stop')
                    .setDescription('Arrête l\'écoute'))
            .addSubcommand(subcommand =>
                subcommand.setName('add')
                    .setDescription('Ajoute un élément à la liste de courses par défaut')
                    .addStringOption(option =>
                        option.setName('element')
                            .setDescription('Élément à ajouter')
                            .setRequired(true)))
            .addSubcommand(subcommand => 
                subcommand.setName('remove')
                    .setDescription('Retire un élément de la liste de courses par défaut')
                    .addStringOption(option =>
                        option.setName('element')
                            .setDescription('Élément à retirer')
                            .setRequired(true)))
            .addSubcommand(subcommand => 
                subcommand.setName('list')
                    .setDescription('Affiche la liste de courses par défaut')
                )
            .addSubcommand(subcommand => 
                subcommand.setName('recap')
                    .setDescription('Affiche un récapitulatif de la liste de courses'))
    ,
    async execute(interaction) {
        await interaction.deferReply({flags : MessageFlags.Ephemeral});

        let message = "";
        const channel = interaction.channel ? interaction.channel : interaction.user;
        const element = interaction.options.getString('element') ? interaction.options.getString('element') : null;

        switch (interaction.options.getSubcommand()) {
            case "start":
                message = await setGroceriesListener(channel);
                break;
            case "stop":
                message = await stopGroceriesListener(channel);
                break;
            case "add":
                message = await addGroceryElement(channel, element)
                break;
            case "remove":
                message = await removeGroceryElement(channel, element);
                break;
            case "list":
                message = await listGroceryElements(channel);
                break;
            case "recap":
                message = await recapGroceryList(channel);
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
    listenerList = await getJsonFromFile(listenerFileName);
    defaultGroceriesList = await getJsonFromFile(groceriesFileName);
    
    // Ensure both are correct types, not null or corrupted
    if (!listenerList ) {
        listenerList = [];
    }
    if (!defaultGroceriesList) {
        defaultGroceriesList = {};
    }

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

        message.react(emoji);
    });

    // delete reacted message
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
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
        if (reaction.emoji.name !== emoji) return;

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
        await saveJsonToFile(listenerListJson, listenerFileName);
        message = `La commande d'écoute des nouveaux messages a été démarrée dans le salon.`;
    }
    
    return message;
}

const stopGroceriesListener = async (channel) =>
{
    if (listenerList.includes(channel.id))
    {
        // delete from list
        const index = listenerList.indexOf(channel.id);
        listenerList.splice(index, 1);
        console.log(listenerList);
        const listenerListJson = JSON.parse(JSON.stringify(listenerList));
        await saveJsonToFile(listenerListJson, listenerFileName);
    }

    else
    {
        return "La commande d'écoute des nouveaux messages n'était pas active.";
    }


    return "La commande d'écoute des nouveaux messages ne sera plus répétée.";
}

const addGroceryElement = async (channel, element) =>
{
    // Ensure defaultGroceriesList is an object
    if (Array.isArray(defaultGroceriesList)) {
        defaultGroceriesList = {};
    }
    
    if (defaultGroceriesList[channel.id] != null && defaultGroceriesList[channel.id].includes(element))
    {
        return `L'élément "${element}" est déjà dans la liste de courses par défaut.`;
    }

    if (defaultGroceriesList[channel.id] == null)
    {
        defaultGroceriesList[channel.id] = [element];
    }

    else
    {
        defaultGroceriesList[channel.id].push(element);
    }

    const groceriesListJson = JSON.parse(JSON.stringify(defaultGroceriesList));
    console.log(defaultGroceriesList);
    console.log(groceriesListJson);
    await saveJsonToFile(groceriesListJson, groceriesFileName);

    return `"${element}" a été ajouté à la liste de courses par défaut.`;
}

const removeGroceryElement = async (channel, element) =>
{
    if (defaultGroceriesList[channel.id] == null || !defaultGroceriesList[channel.id].includes(element))
    {
        return `"${element}" n'est pas dans la liste de courses par défaut.`;
    }

    const index = defaultGroceriesList[channel.id].indexOf(element);
    defaultGroceriesList[channel.id].splice(index, 1);

    const groceriesListJson = JSON.parse(JSON.stringify(defaultGroceriesList));
    await saveJsonToFile(groceriesListJson, groceriesFileName);
    return `"${element}" a été retiré de la liste de courses par défaut.`;
}

const listGroceryElements = async (channel) =>
{
    if (defaultGroceriesList[channel.id] == null || defaultGroceriesList[channel.id].length === 0)
    {
        return "La liste de courses par défaut est vide.";
    }

    for (let i = 0; i < defaultGroceriesList[channel.id].length; i++)
    {
        let message = await channel.send(`${defaultGroceriesList[channel.id][i]}`);
        message.react(emoji);
    }

    return "La liste de courses par défaut a été affichée.";
}

const recapGroceryList = async (channel) => {
    let messageList = await channel.messages.fetch();
    if (messageList.size == 0)
    {
        return "Le salon est vide.";
    }

    let message = "";
    messageList.forEach(msg => {
        message += `- ${msg.content}\n`;
    });

    return message;
}