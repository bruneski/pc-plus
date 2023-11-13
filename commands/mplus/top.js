const { SlashCommandBuilder, MessageManager, Client } = require('discord.js');
const { codeBlock } = require('discord.js');
const RAIDERIO = require('../../src/service/raiderio.js');
const axios = require('axios');
const fs = require('fs');

const gatherScores = async function(data, dest) {
	await Promise.all(data.map( (m, index) => {
		console.log(m);
		let array = [];
		array = m.split('-');
		let character = array[0];
		let realm = !!array[1] ? array[1].replace("'", "-") : "mal-ganis";
		console.log(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
		return axios.get(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
	})).then(raiders => {
		raiders.map((record) => {
			dest.push({
				"name": record.data.name,
				"score": record.data.mythic_plus_scores_by_season[0].scores.all
			})
		})
		return dest;
	}).catch(e => {
		console.error("gatherScores() Error -> ", e.response.data.message);
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('Returns the highest M+ score for the # of players ')
        .addStringOption(option =>
            option.setName('number')
                .setDescription('The number of characters to return')
                .setRequired(true)),
	async execute(interaction) {
		//Add/Remove {ephemeral: true} to make the response Private/Public
		await interaction.deferReply();
        const num = interaction.options.getString('number');
        console.log(num);
        console.log(`Top(${num}) -> `, interaction);
		let guildRes = await axios.get("https://raider.io/api/v1/guilds/profile?region=us&realm=mal-ganis&name=Project%20Cloverfield&fields=members");
		console.log("Guild", guildRes.data);
		// let members = guildRes.data.members;
		// let mPlusMembers = members.filter((m) => {
		// 	return m.rank == 3 || m.rank == 4 || m.rank == 1;
		// });
		//console.log("Competition Runners", mPlusMembers)
		// const mPlusNames = mPlusMembers.map(m => {
		// 	return m.character.name;
		// })
		// console.log("M+ Runners", mPlusNames);
		//console.log("Competition Runners", mPlusNames);
		var roster = fs.readFileSync('data/members.txt','utf8').toString().split("\r\n");
		console.log("Roster", roster);
		//console.log("Paid Runners", paidRunners);
		roster = roster.filter(item => item);
		let mPlusScores = [];
		//TODO: Clean this statemtn up
		let curatedData = await gatherScores(roster, mPlusScores);
		console.log("Competition Runners Raw", mPlusScores);
		//Sorting only top 5 scores
		let topPlayers = mPlusScores.sort((a,b) => b.score-a.score).slice(0,num);
		console.log("Leaderboard", topPlayers);
        let string = ``;
        topPlayers.forEach((player, index) => {
            console.log("topPlayers Loop", player);
            string += `${index+1}. ${player.name} | ${player.score}\n`
        });
        let codeblock = codeBlock(string);
		// const codeblock = codeBlock(`
		// 1. ${top5[0].name} | ${top5[0].score}
		// 2. ${top5[1].name} | ${top5[1].score}
		// 3. ${top5[2].name} | ${top5[2].score}
		// 4. ${top5[3].name} | ${top5[3].score}
		// 5. ${top5[4].name} | ${top5[4].score}`);
		interaction.editReply(`These are the leaderboard results for the top ${num} members of ${guildRes.data.name}:\n` + codeblock);
	},
};