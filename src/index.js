const {Client, IntentsBitField} = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
});

client.login('MTEzNDE4ODAyOTQ5MDI0NTY2Mg.G3V_jY.kscjAvvLt17m8aTWYl37EufgEkboWZV0iX2Eas');