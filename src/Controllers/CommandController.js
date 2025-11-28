import { capitalize } from "../Tools/utils.js";
import { getRealTimeSchedule } from "./APIController.js";

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
            
            let realTimeAvailable = result.horaire_de_depart_reel !== null;
            const real_departure = result.horaire_de_depart_reel ? result.horaire_de_depart_reel : result.horaire_depart_theorique;
            const departureDate = new Date(`1970-01-01T${real_departure}`);
            departureDate.setHours(departureDate.getHours() + 1); // Adjust for timezone if necessary

            const adjustedTime = departureDate.toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 8);
            const current_date = new Date().toLocaleTimeString('fr-FR', { hour12: false }).slice(0, 8);
            
            if (adjustedTime < current_date) continue;

            const departureDateTime = new Date(`1970-01-01T${real_departure}`);
            departureDateTime.setHours(departureDateTime.getHours() + 1);
            const currentDateTime = new Date(`1970-01-01T${current_date}`);
            const timeRemaining = Math.floor((departureDateTime - currentDateTime) / 60000);
            const secondsRemaining = Math.floor(((departureDateTime - currentDateTime) % 60000) / 1000);
            
            message += `- Direction **${result.destination_stop_headsign}** : ${adjustedTime} soit dans ${timeRemaining}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining} minutes`;
            if (realTimeAvailable) {
                message += " (heure réelle)\n";
            }
            else {
                message += " (heure théorique)\n";
            }
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