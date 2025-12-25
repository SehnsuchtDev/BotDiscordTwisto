import {SlashCommandBuilder} from 'discord.js';

export const command = {
    data : new SlashCommandBuilder()
            .setName('about')
            .setDescription('Affiche des informations sur le bot'),
    async execute(interaction) {
        let message = getAbout();
        await interaction.reply({content: message});
    }
};

const getAbout = () =>
{
    const aboutMessage = `Ce bot utilise les données de l'[API Twisto](https://data.twisto.fr/) et de l'[API EtuEDT](https://edt.antoninhuaut.fr/swagger).\n[Repo GitHub](https://github.com/SehnsuchtDev/BotDiscordTwisto) par <@285497350695157760>.`;
    return aboutMessage;
}