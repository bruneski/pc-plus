const {Client, IntentsBitField} = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

console.log(process.env);

const PORT = process.env.PORT;

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
});

client.login(process.env.DISCORD_TOKEN);