const { SlashCommandBuilder, MessageManager, Client } = require('discord.js');
const RAIDERIO = require('../../src/service/raiderio.js');
const axios = require('axios');
const fs = require('fs');

const paidRunners = [
	"Atexcake",
	"Icecarnage",
	"Draths",
	"Feikhal",
	"Boyardaddy",
	"Empyral",
	"Yngnut",
	"Kravick",
	"Zalakan"
]


module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add character to M+ competition')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('The character to add to the competition')
                .setRequired(true)),
	async execute(interaction) {
		//Add/Remove {ephemeral: true} to make the response Private/Public
		await interaction.deferReply({ ephemeral: true });
        //Only allow council to edit the list for data integrity
        //TODO: Transfer this setup to DB
        if(interaction.member.roles.cache.some(role => role.name === 'Council')) {
            console.log("Is Council");
            console.log("Add() -> ", interaction);
            const char = interaction.options.getString('character');
            console.log(char);
            if(!!char) {
                await interaction.editReply(`Adding ${char}`);
                //var writeStream = fs.createWriteStream("text.txt");
                fs.appendFile("data/members.txt", `${char}\r\n` ,function(err){
                    if(err) throw err;
                    console.log('IS WRITTEN');
                });
            } else {
                await interaction.editReply(`Something went wrong`);
            }
        } else {
            console.log("Not a Council Member");
            await interaction.editReply(`You do not have the permissions to use this command. Please contact an admin`);
        }
	},
};