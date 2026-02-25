import { capitalize, getTime, getRemainingTimeString, formatString } from "../Tools/utils.js";
import { getRealTimeSchedule } from "../Controllers/APIController.js";
import moment from 'moment';
import tz from 'moment-timezone';
import {SlashCommandBuilder} from 'discord.js';

export const command = {
    data : new SlashCommandBuilder()
            .setName('passage')
            .setDescription('Affiche les prochains passages d\'une ligne à un arrêt donné')
            .addStringOption(option => 
                option.setName('ligne')
                    .setDescription('La ligne de transport (ex: B, C1, T1, ...)')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('arret')
                    .setDescription('Le nom de l\'arrêt (ex: Gare, République, ...)')
                    .setRequired(true))
            .addNumberOption(option => 
                option.setName('heure')
                    .setDescription('Heure (optionnel)')
                    .setRequired(false))
            .addNumberOption(option => 
                option.setName('minute')
                    .setDescription('Minute (optionnel)')
                    .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        const line = interaction.options.getString('ligne');
        const stop = interaction.options.getString('arret');
        const hour = interaction.options.getNumber('heure');
        const minute = interaction.options.getNumber('minute');

        const message = await getNextStopsString(line, stop, hour, minute);
        await interaction.editReply({content: message});
    }
}

export const reload = () => {}

const getStopList = async (line, stop, hour, minute) =>
{
    console.log(`Fetching next arrival for line ${line} at stop ${stop}`);

    const data = await new Promise((resolve) => {
        getRealTimeSchedule(line, stop, (data) => {
            resolve(data);
        });
    });

    const currentTime = getTime(hour, minute);

    if (data === null)
    {
        console.error({ time: Date.now(), line, stop, data})
        return {
                error: "J'ai po réussi à trouver..",
                currentTime: currentTime.format('HH:mm')
                };
    }

    if (!data || data.results.length === 0)
    {
        console.error({ time: Date.now(), line, stop, data})
        return {
                error: `Aucun horaire trouvé pour la ligne ${line} à l'arrêt ${stop}. Peut-être que l'arrêt ou la ligne est incorrecte.`,
                currentTime: currentTime.format('HH:mm')
                };
    }

    let stopList = {
        currentTime: currentTime.format('HH:mm'),
        stops : {}
    }

    let direction = '';
    for (let result of data.results)
    {
        console.log("-----------------------------------------------------")
        const {departureTime, realTime, differentDays} = getDepartureData(result.horaire_depart_theorique, result.horaire_de_depart_reel, currentTime);

        if (departureTime.day() > currentTime.day()) continue;

        const comparableDepartureTime = new Date(`1970-01-01T${departureTime.format('HH:mm:ss')}`);
        const comparableCurrentTime = new Date(`1970-01-01T${currentTime.format('HH:mm:ss')}`);
        if (comparableDepartureTime < comparableCurrentTime && !differentDays) continue;
        if (formatString(result.destination_stop_headsign) == formatString(result.nom_de_l_arret_stop_name)) continue;

        let tempDirection = Buffer.from(result.destination_stop_headsign, 'latin1').toString('utf8');
        if (direction == '' || direction != tempDirection)
        {
            direction = tempDirection;
            stopList.stops[direction] = [];
        }

        console.log(result);

        const remainingTime = getRemainingTimeString(departureTime, currentTime, differentDays);

        stopList.stops[direction].push({
            departureTime: departureTime.format('HH:mm'),
            remainingTime: remainingTime,
            realTime: realTime
        })
    }

    stopList.stop = data.results[0].nom_de_l_arret_stop_name;

    return stopList;
}

const getNextStopsString = async (line, stop, hour, minute) =>
{
    
    stop = capitalize(stop);
    line = line.toUpperCase();

    const stopList = await getStopList(line, stop, hour, minute);

    if (stopList.error)
    {
        return stopList.error;
    }

    stop = stopList.stop;

    let message = ''
    for (let [direction, stops] of Object.entries(stopList.stops))
    {
        message = message + `\n**Direction ${direction} :**\n`;

        for (let i = 0; i < Math.min(4, stops.length); i++)
        {
            const stopInfo = stops[i];
            message += `- **${stopInfo.departureTime}** soit dans **${stopInfo.remainingTime}**`;  

            if (stopInfo.realTime)
            {
                message += `  _(temps réel)_\n`;
            }

            else
            {
                message += `\n`;
            }
        }

    }

    if (message == '')
    {
        message = `Aucun départ prévu pour le **${line}** à **${stop}**`;

        if (hour)
        {
            message += ` à ${stopList.currentTime}.`;
        }

        else
        {
            message += ` dans l'heure.`;
        }
    }

    else
    {
        message = `**Prochains départs du ${line} à ${stop} à ${stopList.currentTime}**\n` + message;
    }

    return message;
}

const getDepartureData = (date, realTimeDate, currentTime) => {
    if (date.slice(0, 2) === '24') {
        date = '00' + date.slice(2);
    }

    if (realTimeDate && realTimeDate.slice(0, 2) === '24') {
        realTimeDate = '00' + realTimeDate.slice(2);
    }

    let departureTime = moment(date, 'HH:mm:ss');

    let dateInRealTime = false;

    if (realTimeDate != undefined && realTimeDate != date)
    {
        //let realTime = moment.utc(realTimeDate, 'HH:mm:ss').tz('Europe/Paris');
        let realTime = moment.utc(realTimeDate, 'HH:mm:ss');
        console.log("Real-time date:", realTimeDate, "Parsed real-time:", realTime.format('HH:mm:ss'), "Theorical departure:", departureTime.format('HH:mm:ss'));

        if (!departureTime.isSame(realTime))
        {
            dateInRealTime = true;
            departureTime = realTime;
        }
    }

    const midday = moment('12:00:00', 'HH:mm:ss');
    currentTime = moment(currentTime, 'HH:mm:ss');

    if (currentTime.isBefore(midday) && departureTime.isAfter(midday))
    {
        departureTime = departureTime.add(-1, 'day');
    }

    let differentDays = departureTime.day() !== currentTime.day();

    return {departureTime, realTime: dateInRealTime, differentDays};
}