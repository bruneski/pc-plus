const {Client, IntentsBitField} = require('discord.js');
const dotenv = require('dotenv');
const express = require("express");
const app = express();

dotenv.config();

app.use('/healthcheck', require('./healthcheck'));

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
});

client.login(process.env.DISCORD_TOKEN);

const PORT = 3000;
app.listen(PORT, console.log("Server has started at port " + PORT));