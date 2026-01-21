import {SlashCommandBuilder, MessageFlags} from 'discord.js';

export const command = {
    data : new SlashCommandBuilder()
            .setName('vider')
            .setDescription('Vide le salon courant'),
    async execute(interaction) {
        const message = await emptyChannel(interaction);
        await interaction.reply({content: message, flags: MessageFlags.Ephemeral});
    }
};

export const reload = () => {}

const emptyChannel = async (interaction) =>
{
    const channel = interaction.channel;
    const fetchedMessages = await channel.messages.fetch();
    let message;
    await channel.bulkDelete(fetchedMessages)
        .then(() => {
            message = 'Le salon a été vidé avec succès.';
        })
        .catch(error => {
            console.error('Erreur lors de la suppression des messages : ', error);
            message = 'Une erreur est survenue lors de la tentative de vider le salon.';
        });

    return message;
}