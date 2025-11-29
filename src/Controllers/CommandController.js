import { capitalize, getDepartureTime, getCurrentTime, getRemainingTimeString } from "../Tools/utils.js";
import { getRealTimeSchedule } from "./APIController.js";
import moment from 'moment';

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
        console.log(data);

        if (data === null)
        {
            channel.send("J'ai po réussi à trouver..");
        }

        if (!data || data.results.length === 0)
        {
            channel.send(`Aucun horaire trouvé pour la ligne ${line} à l'arrêt ${stop}.`);
            return;
        }

        let message = `**Prochains arrêts du ${line} à ${stop}:**\n`;
        for (let result of data.results)
        {
            console.log(result)
            
            const departureTime = getDepartureTime(result.horaire_de_depart_reel);
            console.log(departureTime)
            const currentTime = getCurrentTime();
            const midday = moment().startOf('day').add(12, 'hours').format('HH:mm:ss');

            const differentDays = (currentTime > midday && departureTime < midday)
            
            if (departureTime < currentTime && !differentDays) continue;

            const remainingTime = getRemainingTimeString(departureTime, currentTime, differentDays);
            
            message += `- Direction **${result.destination_stop_headsign}** : ${departureTime} soit dans ${remainingTime}\n`;
            
        }
        channel.send(message);
    });
}

export const getHelp = (channel) =>
{
    const helpMessage = `**Commandes disponibles :**
- \`@Twistouille passage <ligne> <arrêt>\` : Obtenir les prochains passages pour une ligne et un arrêt donnés.
- \`@Twistouille help\` : Afficher ce message d'aide.
`;
    channel.send(helpMessage);
}