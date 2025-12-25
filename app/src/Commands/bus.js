import { capitalize, getDepartureTime, getTime, getRemainingTimeString, formatString } from "../Tools/utils.js";
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

        const message = await getNextArrival(line, stop, hour, minute);
        await interaction.editReply({content: message});
    }
}

const getNextArrival = async (line, stop, hour, minute) =>
{
    stop = capitalize(stop);
    line = line.toUpperCase();
    console.log(stop)

    console.log(`Fetching next arrival for line ${line} at stop ${stop}`);

    const data = await new Promise((resolve) => {
        getRealTimeSchedule(line, stop, (data) => {
            resolve(data);
        });
    });

    //console.log(data);

    if (data === null)
    {
        console.error({ time: Date.now(), line, stop, data})
        return "J'ai po réussi à trouver.."
    }

    if (!data || data.results.length === 0)
    {
        console.error({ time: Date.now(), line, stop, data})
        return `Aucun horaire trouvé pour la ligne ${line} à l'arrêt ${stop}. Peut-être que l'arrêt ou la ligne est incorrecte.`;
    }

    const currentTime = getTime(hour, minute);
    const currentTimeLimit = getTime(hour, minute, 60);

    let message = ''
    let direction = '';
    for (let result of data.results)
    {
        console.log("-----------------------------------------------------")
        const {departureTime, realTime} = getDepartureTime(result.horaire_depart_theorique, result.horaire_de_depart_reel);

        const differentDays = moment(result.date_du_jour).format('YYYY-MM-DD') !== moment().tz('Europe/Paris').format('YYYY-MM-DD');

        console.log(departureTime, currentTime, departureTime <= currentTime, differentDays, departureTime >= currentTimeLimit)

        if (departureTime <= currentTime && !differentDays || departureTime >= currentTimeLimit) continue;
        if (formatString(result.destination_stop_headsign) == formatString(result.nom_de_l_arret_stop_name)) continue;

        console.log(result)

        if (direction == '' || direction != result.destination_stop_headsign)
        {
            direction = result.destination_stop_headsign;
            message = message + `\n**Direction ${Buffer.from(direction, 'latin1').toString('utf8')} :**\n`;
        }

        const remainingTime = getRemainingTimeString(departureTime, currentTime, differentDays);

        message += `- **${departureTime}** soit dans **${remainingTime}**`;

        if (realTime)
        {
            message += `  _(heure réelle)_\n`;
        }

        else
        {
            message += `\n`;
        }
        
    }

    if (message == '')
    {
        message = `Aucun départ prévu pour le **${line}** à **${stop}**`;

        if (hour)
        {
            message += ` à ${currentTime}.`;
        }

        else
        {
            message += ` dans l'heure.`;
        }
    }

    else
    {
        message = `**Prochains départs du ${line} à ${stop} à ${currentTime}**\n` + message;
    }

    return message;
}