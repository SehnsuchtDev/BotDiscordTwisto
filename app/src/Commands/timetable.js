import { capitalize, getDepartureTime, getCurrentTime, getRemainingTimeString, formatString } from "../Tools/utils.js";
import { getScheduleForResource, getRealTimeSchedule } from "../Controllers/APIController.js";
import moment from 'moment';
import tz from 'moment-timezone';
import {SlashCommandBuilder} from 'discord.js';
import { getJsonFromFile, saveJsonToFile } from "../Controllers/FileController.js";

let intervalList = {};

export const command = {
    data : new SlashCommandBuilder()
            .setName('dispo')
            .setDescription('Affiche les salles informatiques disponibles à l\'IUT')
            .addSubcommand(option => 
                option.setName('check')
                    .setDescription('Vérifie les salles informatiques disponibles une seule fois'))
            .addSubcommand(option => 
                option.setName('start')
                    .setDescription('Appelle la commande toutes 5 minutes'))
            .addSubcommand(option => 
                option.setName('stop')
                    .setDescription('Arrête la boucle')),
    async execute(interaction) {
        await interaction.deferReply();

        let message = "";

        switch (interaction.options.getSubcommand()) {
            case "start":
                message = await setAvailableRoomsTimer(interaction.channel);
                break;
            case "stop":
                message = await stopAvailableRoomsTimer(interaction.channel);
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

    for (let i = 0; i < channelValues.length; i++)
    {
        let channel = channelValues[i];
        channel = await client.channels.fetch(channel.id);
        console.log("Reloading timetable loop for channel " + channel.name);
        setAvailableRoomsTimer(channel, false);
    }
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

const setAvailableRoomsTimer = async (channel, fromReload = true) =>
{
    let intervalId = setInterval(async () => {
        console.log("Sending available rooms loop message to channel " + channel.name);
        let message = await getAvailableRooms();
        channel.send({content: message});
    }, 5 * 60 * 1000); 

    intervalList[channel.id] = intervalId;
    let message = "";

    if (fromReload)
    {
        await saveJsonToFile(Object.keys(intervalList), fileName);
        message = "La commande d'affichage des salles informatiques disponibles toutes les 5 minutes a été activée.";
    }
    
    return message;
}

const stopAvailableRoomsTimer = async (channel) =>
{
    if (intervalList[channel.id])
    {
        clearInterval(intervalList[channel.id]);
        delete intervalList[channel.id];
        await saveJsonToFile(Object.keys(intervalList), fileName);
    }

    else
    {
        return "La commande d'affichage des salles informatiques n'était pas active.";
    }


    return "La commande d'affichage des salles informatiques ne sera plus répétée.";
}