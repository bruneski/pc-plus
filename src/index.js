const {Client, Collection, Events, IntentsBitField} = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

dotenv.config();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.login(process.env.DISCORD_TOKEN);

client.on("messageCreate", (message) => {
    //console.log(message);
    if(message.author.bot) {
        return;
    }

    //#admin-chat
    // if(message.channelId === "222942645188558860") {
    //     message.reply("I see you");
    // }

    //#council-chat
    if(message.channelId === "351041119104139264") {
        // if(message.author.username === 'zalakan') {
        //     message.reply("Did you know Zal was an Arena Master?");
        // }
        // if(message.author.username === 'grippingbeef') {
        //     message.reply("Frank the Tank");
        // }
        // if(message.author.username === 'bruneski') {
        //     message.reply("This guy has a lot of mounts");
        // }
    }
});

//Slash commands
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});