const {Client, IntentsBitField} = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
});

client.login(process.env.DISCORD_TOKEN);

client.on("messageCreate", (message) => {
    if(message.author.bot) {
        return;
    }
    if(message.channel === "admin-chat") {
        console.log("Mentions", message.mentions);
    }
});