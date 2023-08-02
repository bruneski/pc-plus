const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the top 5 in guild Raider.io scores for the current season'),
	async execute(interaction) {
		await interaction.reply('Leaderboard Results!');
	},
};