import "dotenv/config"
import { Client, GatewayIntentBits, Events, REST, Routes, Collection, MessageFlags } from 'discord.js';
import { configDotenv } from "dotenv";
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from "url";
import moment from 'moment'
import tz from 'moment-timezone';


configDotenv({ path: '../.env' });

export const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.APPLICATION_ID;

client.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.commands = new Collection();
    const commands = [];

    // Get __dirname equivalent for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Grab all the command files from the commands directory
    const foldersPath = path.join(__dirname, 'Commands');
    const commandFiles = fs.readdirSync(foldersPath);

	for (const file of commandFiles) {
    let filePath = path.join(foldersPath, file);
    filePath = pathToFileURL(filePath).href;
    
    try {
        const module = await import(filePath);
        const command = module.command || module.default || module;
		const reload = module.reload || (() => {});
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.error(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
        }

		if (typeof reload === 'function') {
			reload(client);
		}
    } catch (error) {
        console.error(`[ERROR] Failed to load command ${file}:`, error);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy your commands
(async () => {
    try {        
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
    } catch (error) {
        console.error(error);
    }
})();
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = interaction.client.commands.get(interaction.commandName);

	console.log(moment().tz("Europe/Paris").format("HH:mm") + " " + interaction.user.tag + " " + interaction.commandName);
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        
        const errorResponse = {
            content: 'Erreur lors de l\'exécution de cette commande.',
            flags: MessageFlags.Ephemeral
        };
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorResponse);
            } else {
                await interaction.reply(errorResponse);
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

client.login(token);