const { SlashCommandBuilder } = require('discord.js');
const { codeBlock, EmbedBuilder } = require('discord.js');
const RAIDERIO = require('../../src/service/raiderio.js');
const axios = require('axios');
const fs = require('fs');
//const { util } = require('../../src/utilities/util.js');

//var roster = fs.readFileSync('data/members.txt','utf8').toString().split("\r\n");
//console.log(roster);

let teamNames = [
	"□□□□□□□□□□□□□□□□",
	"Poopy Buttholes",
	"Get Rabid",
	"Fuck It, We Brawl",
	"ManBearLiz",
	"Beefcake Brigade",
	"Light Between the Eyes"
]

const gatherScores = async function(data, dest) {
	console.log("gatherScores() -> ", data);
	await Promise.all(data.map((m, index) => {
			console.log("Query pass", m);
			let array = [];
			array = m.split('-');
			let character = array[0];
			let realm = !!array[1] ? array[1].replace("'", "-") : "mal-ganis";
			console.log(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
			return axios.get(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
	})).then(raiders => {
		//console.log("RaiderIO Data -> ", raiders);
		raiders.map((record) => {
			console.log("Raider Record", record.data);
			dest.push({
				"name": record.data.name,
				"score": record.data.mythic_plus_scores_by_season[0].scores.all
			})
		})
		console.log("Final Scores", dest);
		return dest;
	}).catch(e => {
		console.error("gatherScores() Error -> ", e.response.data.message);
	})
}

const gatherTeamScores = async function(data, dest) {
	let requests = [];
	data.forEach((team, index) => {
		console.log("Team", team);
		team.forEach((player) => {
			console.log("Query pass", player);
			let array = [];
			array = player.split('-');
			let character = array[0];
			let realm = !!array[1] ? array[1].replace("'", "-") : "mal-ganis";
			console.log(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
			requests.push(
				new Promise((resolve, reject) => {
				axios.get(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`)
				.then((response) => {
					dest.push({
						"name": response.data.name,
						"score": response.data.mythic_plus_scores_by_season[0].scores.all,
						"team": index
					})
					return response.data;
				}).then((data) => {
					resolve(data);
				});
			})
			)
		})
	})
	console.log("Requests -> ", requests);
	const result = await Promise.all(requests);
	console.log("Final Result", dest);
	return dest;
}

const calculateTeams = function(teams) {
	const sanitizedTeams = Object.entries(
		// What you have done
		teams.reduce((acc, { name, score, team }) => {
		  // Group initialization
		  if (!acc[team]) {
			acc[team] = [];
		  }
		  
		  // Grouping
		  // FIX: only pushing the object that contains id and value
		  acc[team].push({ name, score });
	  
		  return acc;
		}, {})
	  ).map(([team, players]) => ({ team, players }));

	console.log(sanitizedTeams);
	sanitizedTeams.map((team, index) => {
		let numPlayers = team.players.length;
		console.log(team.players);
		console.log(team.players.length);
		team.total = team.players.reduce((n, {score}) => n + score, 0);
		team.average = team.total / numPlayers;
		team.title = teamNames[index];
		team.roster = team.players.reduce((n, {name}) => n + "\n" + name, "");
		// let totalScore = (team.players).reduce(acc, score => {})
		// })
		// team.score = totalScore / numPlayers;
	});

	return sanitizedTeams.sort((a,b) => a.team - b.team);

	// return teams.map(player => {
	// 	console.log("calculateTeams() -> ", player);
	// })
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rankings')
		.setDescription('Shows the rankings for each team in the current M+ competition'),
	async execute(interaction) {
		//Add/Remove {ephemeral: true} to make the response Private/Public
		await interaction.deferReply();
		var roster = fs.readFileSync('data/members.txt','utf8').toString().split("\r\n");
		let rosterFiltered;
		console.log("Roster", roster);
		rosterFiltered = roster.map(item => {
			console.log("item", item);
			console.log(item.split(','));
			return item.split(',');
		});
		console.log("Roster Filtered", rosterFiltered);
		let mPlusScores =[];
		//TODO: Clean this statement up
		let curatedData = await gatherTeamScores(rosterFiltered, mPlusScores)
		// rosterFiltered.forEach((team) => {
		// 	gatherScores(team, mPlusScores);
		// 	console.log("ForEach Scores -> ", mPlusScores);
		// })
		console.log("Raw M+ Data", mPlusScores);
		console.log("Curated Scores -> ", curatedData);
		let teamData = calculateTeams(curatedData);
		console.log("M+ Teams -> ", teamData);
		// let teamBreakdownJSON = teamData.map(team => {
		// 	return { name: }
		// })
		let embedFormat = teamData.map(team => {
			return {
				name: team.title,
				value: team.average.toFixed(2) + "\n"+ team.roster,
				inline: true
			}
		})
		console.log('Embed Format', embedFormat);

		//Sorting only top 5 scores
		//let top5 = mPlusScores.sort((a,b) => b.score-a.score).slice(0,5);
		// console.log("Leaderboard", top5);
		// const codeblock = codeBlock(`
		// 1. ${top5[0].name} | ${top5[0].score}
		// 2. ${top5[1].name} | ${top5[1].score}
		// 3. ${top5[2].name} | ${top5[2].score}
		// 4. ${top5[3].name} | ${top5[3].score}
		// 5. ${top5[4].name} | ${top5[4].score}`);
		// interaction.editReply(`These are the leaderboard results for the top 5 members of ${guildRes.data.name}:\n` + codeblock);
		// inside a command, event listener, etc.
		const exampleEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle('TWW Season 1 M+ Competition Rankings')
		.setURL('https://discord.gg/project-cloverfield')
		.setAuthor({ name: 'PC Plus', iconURL: 'https://static.wikia.nocookie.net/cloverfield/images/f/fb/Slusho.png/revision/latest?cb=20080717173250', url: 'http://www.matthewrbrune.com' })
		.setDescription('These are the current scores of the M+ teams')
		.setThumbnail('https://static.wikia.nocookie.net/cloverfield/images/f/fb/Slusho.png/revision/latest?cb=20080717173250')
		.addFields(embedFormat)
		//.addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
		//.setImage('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter({ text: 'Written by Ice'});

		interaction.editReply({ embeds: [ exampleEmbed ] });
	},
};