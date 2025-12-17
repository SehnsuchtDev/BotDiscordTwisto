import { capitalize, getDepartureTime, getCurrentTime, getRemainingTimeString, formatString } from "../Tools/utils.js";
import { getScheduleForResource, getRealTimeSchedule } from "./APIController.js";
import moment from 'moment';
import tz from 'moment-timezone';

export const getNextArrival = (data, channel) =>
{
    let line = data[0];
    let stop = data[1];
    stop = capitalize(stop);

    if (data.length > 2)
    {
        stop += " " + data.slice(2).join(" ");
    }

    console.log(`Fetching next arrival for line ${line} at stop ${stop}`);

    getRealTimeSchedule(line, stop, (data) => {
        if (data === null)
        {
            channel.send("J'ai po réussi à trouver..");
            console.error({ time: Date.now(), line, stop, data})
        }

        if (!data || data.results.length === 0)
        {
            channel.send(`Aucun horaire trouvé pour la ligne ${line} à l'arrêt ${stop}. Peut-être que l'arrêt ou la ligne est incorrecte.`);
            console.error({ time: Date.now(), line, stop, data})
            return;
        }

        let message = ''
        let stop_headsign = stop;
        for (let result of data.results)
        {
            const departureTime = getDepartureTime(result.horaire_depart_theorique);
            const currentTime = getCurrentTime();

            const midday = moment().startOf('day').add(12, 'hours').format('HH:mm:ss');
            const differentDays = (currentTime > midday && departureTime < midday)
            
            if (departureTime < currentTime && !differentDays) continue;
            if (formatString(result.destination_stop_headsign) == formatString(result.nom_de_l_arret_stop_name)) continue;

            const remainingTime = getRemainingTimeString(departureTime, currentTime, differentDays);

            stop_headsign = Buffer.from(result.destination_stop_headsign, 'latin1').toString('utf8');
            
            message += `- Direction **${stop_headsign}** : ${departureTime} soit dans ${remainingTime}\n`;
            
        }

        if (message == '')
        {
            message = `**Aucun départ prévu pour le ${line} à ${stop}**\n`;
        }

        else
        {
            message = `**Prochains départs du ${line} à ${stop}:**\n` + message;
        }
        channel.send(message);
    });
}

export const getHelp = (channel) =>
{
    const helpMessage = `**Commandes disponibles :**
- \`@Twistouille passage <ligne> <arrêt>\` : Obtenir les prochains passages pour une ligne et un arrêt donnés.
- \`@Twistouille dispo\` : Voir les salles informatiques disponibles.
- \`@Twistouille help\` : Afficher ce message d'aide.
- \`@Twistouille about\` : Informations sur le bot.
`;
    channel.send(helpMessage);
}

export const getAbout = (channel) =>
{
    const aboutMessage = `Ce bot utilise les données de l'[API Twisto](https://data.twisto.fr/).\n[Repo GitHub](https://github.com/SehnsuchtDev/BotDiscordTwisto) par <@285497350695157760>.`;
    channel.send(aboutMessage);
}

export const getUnknownCommand = (channel) =>
{
    const unknownCommandMessage = "**Commande inconnue.** Tapez `@Twistouille help` pour voir la liste des commandes disponibles.";
    channel.send(unknownCommandMessage);
}

export const getAvailableRooms = async (channel) =>
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

    message = "**Salles informatiques disponibles :**" + message;
    channel.send(message);
}

const searchRoom = async (roomId) =>
{
    return new Promise((resolve) => {
        getScheduleForResource(roomId, (data) => {
            if (data === null)
            {
                console.error({ time: Date.now(), data})
                resolve("");
                return;
            }

            let tmp = data.find((resource) => {
                const now = moment().tz('Europe/Paris');
                const start = moment(resource.start);
                const end = moment(resource.end);
                return now.isBetween(start, end);
            })

            let message = "";
            if (tmp == undefined)
            {
                message += `\n- **${data[0].location}**`;
            }

            resolve(message);
        })
    })
}