import { capitalize, getDepartureTime, getCurrentTime, getRemainingTimeString, formatString } from "../Tools/utils.js";
import { getScheduleForResource, getRealTimeSchedule } from "../Controllers/APIController.js";
import moment from 'moment';
import tz from 'moment-timezone';
import {SlashCommandBuilder} from 'discord.js';
import { getJsonFromFile, saveJsonToFile } from "../Controllers/FileController.js";

let intervalList = {};
let intervalDurationList = {};

export const command = {
    data : new SlashCommandBuilder()
            .setName('dispo')
            .setDescription('Affiche les salles informatiques disponibles à l\'IUT')
            .addSubcommand(subcommand => 
                subcommand.setName('check')
                    .setDescription('Vérifie les salles informatiques disponibles une seule fois'))
            .addSubcommand(subcommand => 
                subcommand.setName('start')
                    .setDescription('Appelle la commande régulièrement')
                    .addNumberOption(option => 
                        option.setName('intervalle')
                            .setDescription('Intervalle en minutes (par défaut 5 minutes)')
                            .setRequired(false)))
            .addSubcommand(subcommand => 
                subcommand.setName('stop')
                    .setDescription('Arrête la boucle')),
    async execute(interaction) {
        await interaction.deferReply();

        let message = "";
        const channel = interaction.channel ? interaction.channel : interaction.user;

        console.log("command channel id: " + (interaction.channel ? interaction.channel.id : null), interaction.user ? interaction.user.id : null);

        switch (interaction.options.getSubcommand()) {
            case "start":
                const interval = interaction.options.getNumber('intervalle') || 5;
                message = await setAvailableRoomsTimer(channel, false, interval);
                break;
            case "stop":
                message = await stopAvailableRoomsTimer(channel);
                break;
            case "check":
                message = await getAvailableRooms();
        }

        await interaction.editReply({content: message});
    }
}

const fileName = "serversWithLoop.json"
export const reload = async (client) => {
    const savedData = await getJsonFromFile(fileName);
    const channelValues = savedData ? savedData : [];

    for (let [channelId, data] of Object.entries(savedData))
    {
        let channel = await getChannel(client, channelId);

        if (channel == null)
        {
            continue;
        }

        setAvailableRoomsTimer(channel, true, data.interval, data.lastMessage);
    }
}

const getChannel = async (client, channelId) =>
{
    console.log("Fetching channel with ID " + channelId);
    let channel = null;
    try {
        channel = await client.channels.fetch(channelId);
        console.log("Reloading timetable loop for channel " + channel.name);
    } catch (error) {
        try {
            channel = await client.users.fetch(channelId);
            console.log("Reloading timetable loop for user " + channel.username);
        } catch (userError) {
            console.error(`Failed to fetch channel with ID ${channelId}:`, userError);
        }
    }

    return channel;
}

const getAvailableRooms = async () =>
{
    const ITRooms = [39005, // 2237
                     38484, // 2236 
                     37590, // 2235
                     38113, // 2129 
                     39491, // 2127
                     39646, // 2125 
                     39568, // 2123 
                     37355 // 1109
                    ]
    let message = "";

    for (let roomId of ITRooms)
    {
        let roomName = await searchRoom(roomId);
        message += roomName
    }

    if (message == "")
    {
        message = "Toutes les salles informatiques sont occupées. DSL :(";
    }

    else
    {
        message = "**Salles informatiques disponibles :**" + message;
    }

    return message;
}

const searchRoom = async (roomId) =>
{
    return new Promise((resolve) => {
        getScheduleForResource(roomId, (data) => {
            // console.log(data);

            if (data === null)
            {
                console.error({ time: Date.now(), data})
                resolve("");
                return;
            }

            const now = moment().tz('Europe/Paris');

            let currentCourse = data.find((resource) => {
                const start = moment(resource.start).tz('Europe/Paris');
                const end = moment(resource.end).tz('Europe/Paris');
                return now.isBetween(start, end, undefined, '[]');
            })

            let message = "";
            if (currentCourse == undefined)
            {
                let nextCourse = data.find((resource) => {
                    const start = moment(resource.start).tz('Europe/Paris');
                    return now.isBefore(start);
                });

                let nextCourseDate = moment(nextCourse.start).tz('Europe/Paris');;

                let differentDays = now.get('date') !== nextCourseDate.get('date');
                
                let timeString = ""
                if (differentDays)
                {
                    timeString = "toute la journée";
                }

                else 
                {
                    let remainingTime = getRemainingTimeString(nextCourseDate.format('HH:mm:ss'), now.format('HH:mm:ss'), false);
                    timeString = `pendant encore ${remainingTime} (prochain cours à ${nextCourseDate.format('HH:mm')})`;
                }

                message += `\n- **${data[0].location}** ${timeString}`;
            }

            resolve(message);
        })
    })
}

const sendAvailableRoomsTimerMessage = async (channel) =>
{
    console.log("Sending available rooms loop message to channel " + (channel.name ? channel.name : channel.username));
    let message = await getAvailableRooms();
    channel.send({content: message});
    intervalDurationList[channel.id].lastMessage = moment().tz('Europe/Paris').format("DD/MM/YYYY HH:mm:ss");
    const intervalListJson = JSON.parse(JSON.stringify(intervalDurationList));
    saveJsonToFile(intervalListJson, fileName);
}

const setAvailableRoomsTimer = async (channel, fromReload = false, interval, lastMessage = null) =>
{
    intervalDurationList[channel.id] = {interval, lastMessage: lastMessage};

    if (lastMessage != null)
    {
        const lastMessageDate = moment(lastMessage, "DD/MM/YYYY HH:mm:ss");
        const timeUntilNextMessage = interval * 60 * 1000 - (moment().tz('Europe/Paris').diff(lastMessageDate));
        const timeoutId = setTimeout(async () => {
            await setAvailableRoomsTimer(channel, fromReload, interval);
        }, timeUntilNextMessage);
        intervalList[channel.id] = timeoutId;
        return;
    }

    let intervalId = setInterval(async () => {
        await sendAvailableRoomsTimerMessage(channel);
    }, interval * 60 * 1000); 
    intervalList[channel.id] = intervalId;

    let message = "";

    if (!fromReload)
    {
        const intervalListJson = JSON.parse(JSON.stringify(intervalDurationList));
        await saveJsonToFile(intervalListJson, fileName);
        message = `La commande d'affichage des salles informatiques disponibles toutes les ${interval} minutes a été activée.`;
    }

    await sendAvailableRoomsTimerMessage(channel);
    
    return message;
}

const stopAvailableRoomsTimer = async (channel) =>
{
    if (intervalList[channel.id])
    {
        clearInterval(intervalList[channel.id]);
        delete intervalList[channel.id];
        delete intervalDurationList[channel.id];
        const intervalListJson = JSON.parse(JSON.stringify(intervalDurationList));
        await saveJsonToFile(intervalListJson, fileName);
    }

    else
    {
        return "La commande d'affichage des salles informatiques n'était pas active.";
    }


    return "La commande d'affichage des salles informatiques ne sera plus répétée.";
}