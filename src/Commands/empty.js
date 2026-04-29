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

    await fetchedMessages.forEach(msg => {
        msg.delete().catch(() => {
            console.error('Erreur lors de la suppression d\'un message : ', error);
            message = 'Une erreur est survenue lors de la tentative de vider le salon.';
        });
    });

    message = 'Le salon a été vidé avec succès.';
    return message;
}