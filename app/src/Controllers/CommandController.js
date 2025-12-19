import { capitalize, getDepartureTime, getCurrentTime, getRemainingTimeString, formatString } from "../Tools/utils.js";
import { getScheduleForResource, getRealTimeSchedule } from "./APIController.js";
import moment from 'moment';
import tz from 'moment-timezone';

export const getNextArrival = (data, channel) =>
{
    let line = data[0];
    let stop = data[1];
    stop = capitalize(stop);
    line = line.toUpperCase();

    if (data.length > 2)
    {
        stop += " " + data.slice(2).join(" ");
    }

    console.log(`Fetching next arrival for line ${line} at stop ${stop}`);

    getRealTimeSchedule(line, stop, (data) => {
        console.log(data);

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
        let direction = '';
        for (let result of data.results)
        {

            const departureTime = getDepartureTime(result.horaire_depart_theorique);
            const currentTime = getCurrentTime();
            const currentTimeLimit = getCurrentTime(60);

            const midday = moment().startOf('day').add(12, 'hours').format('HH:mm:ss');
            const differentDays = (currentTime > midday && departureTime < midday);

            if (departureTime <= currentTime && !differentDays || departureTime >= currentTimeLimit) continue;
            if (formatString(result.destination_stop_headsign) == formatString(result.nom_de_l_arret_stop_name)) continue;

            if (direction == '' || direction != result.destination_stop_headsign)
            {
                direction = result.destination_stop_headsign;
                message = message + `\n**Direction ${Buffer.from(direction, 'latin1').toString('utf8')} :**\n`;
            }

            const remainingTime = getRemainingTimeString(departureTime, currentTime, differentDays);

            message += `- **${departureTime}** soit dans **${remainingTime}**\n`;
            
        }

        stop = stop.toUpperCase();

        if (message == '')
        {
            message = `**Aucun départ prévu pour le ${line} à ${stop}**\n`;
        }

        else
        {
            message = `**Prochains départs du ${line} à ${stop}**\n` + message;
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
    const aboutMessage = `Ce bot utilise les données de l'[API Twisto](https://data.twisto.fr/) et de l'[API EtuEDT](https://edt.antoninhuaut.fr/swagger).\n[Repo GitHub](https://github.com/SehnsuchtDev/BotDiscordTwisto) par <@285497350695157760>.`;
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

    if (message == "")
    {
        message = "Toutes les salles informatiques sont occupées. DSL :(";
    }

    else
    {
        message = "**Salles informatiques disponibles :**" + message;
    }

    channel.send(message);
}

const searchRoom = async (roomId) =>
{
    return new Promise((resolve) => {
        getScheduleForResource(roomId, (data) => {
            console.log(data);

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
                    timeString = "(prochain cours le " + nextCourseDate.format('DD/MM') + ")";
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