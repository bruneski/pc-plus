const { SlashCommandBuilder } = require('discord.js');
const { codeBlock, EmbedBuilder } = require('discord.js');
const RAIDERIO = require('../../src/service/raiderio.js');
const axios = require('axios');
const fs = require('fs');
const winston = require('winston');
const { combine, timestamp, json } = winston.format;
//const { util } = require('../../src/utilities/util.js');

//var roster = fs.readFileSync('data/members.txt','utf8').toString().split("\r\n");

const LOG_FORMAT = winston.format.combine(
    winston.format.align(),
    winston.format.timestamp({format:'DD-MM-YYYY T hh:mm:ss.sss A'}),
    
    winston.format.printf(({ level, message, timestamp, label }) => {
        return `[ ${level.toUpperCase()} | ${timestamp} | ${message} ]`;
    }));

const logger = winston.createLogger({
	// level: 'info',
	// format: combine(
	// 	winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
	// 	winston.format.prettyPrint(),
	// 	winston.format.colorize(),
	// 	json()
	// ),
	format: LOG_FORMAT,
	defaultMeta: { service: '/rankings' },
	transports: [
	  //
	  // - Write all logs with importance level of `error` or higher to `error.log`
	  //   (i.e., error, fatal, but not other levels)
	  //
	  new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
	  //
	  // - Write all logs with importance level of `info` or higher to `combined.log`
	  //   (i.e., fatal, error, warn, and info, but not trace)
	  //
	  new winston.transports.File({ filename: `./logs/combined.log` }),
	],
  });

let teamNames = [
	"Ice Creamers",
	"Glace",
	"Total Iceholes",
	"parsley.gg"
]

const gatherScores = async function(data, dest) {
	console.log("gatherScores() -> ", data);
	await Promise.all(data.map((m, index) => {
			let array = [];
			array = m.split('-');
			let character = array[0];
			let realm = !!array[1] ? array[1].replace("'", "-") : "mal-ganis";
			console.log(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
			return axios.get(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
	})).then(raiders => {
		//console.log("RaiderIO Data -> ", raiders);
		raiders.map((record) => {
			//console.log("Raider Record", record.data);
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
			//console.log("Query pass", player);
			let array = [];
			array = player.split('-');
			let character = array[0];
			let realm = !!array[1] ? array[1].replace(/'/g, '-') : "mal-ganis";
			logger.info(`https://raider.io/api/v1/characters/profile?region=us&realm=${encodeURI(realm)}&name=${encodeURI(character)}&fields=mythic_plus_scores_by_season:current`);
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
					logger.info(`gatherTeamScores() -> ${JSON.stringify(data)}`);
					resolve(data);
				}).catch((err) => {
					logger.error(`gatherTeamScores() -> ${err}`)
				});
			})
			)
		})
	})
	const result = await Promise.all(requests);
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

	//console.log("Grouped Teams", sanitizedTeams);
	sanitizedTeams.map((team, index) => {
		let numPlayers = team.players.length;
		console.log("Grouped Teams", team.players);
		team.total = team.players.reduce((n, {score}) => n + score, 0);
		team.average = team.total / numPlayers;
		team.title = teamNames[index];
		team.roster = team.players.reduce((n, {name, score}) => n + "\n" + name + " - " + score, "");
	});

	return sanitizedTeams.sort((a,b) => a.team - b.team);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rankings')
		.setDescription('Shows the rankings for each team in the current M+ competition'),
	async execute(interaction) {
		//TODO: Make this a configuration
		//Add/Remove {ephemeral: true} from deferReply() to make the response Private/Public
		await interaction.deferReply();
		var roster = fs.readFileSync('data/members.txt','utf8', (err, data) => {
			console.log("File Data", data.toString());
			return data.toString();
		})
		roster = roster.split('\n').map(line => line.replace('\r', ''));
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
		console.log("Individual Scores -> ", curatedData);
		let teamData = calculateTeams(curatedData);
		console.log("M+ Teams -> ", teamData);
		// let teamBreakdownJSON = teamData.map(team => {
		// 	return { name: }
		// })
		let embedFormat = teamData.map(team => {
			return {
				name: team.title,
				value: `${team.average.toFixed(2)}` + "\n"+ team.roster,
				inline: true
			}
		})
		console.log('Embed Data', embedFormat);

		const exampleEmbed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle('TWW Season 2 M+ Competition Rankings')
		.setURL('https://discord.gg/project-cloverfield')
		.setAuthor({ name: 'PC Plus', iconURL: 'https://static.wikia.nocookie.net/cloverfield/images/f/fb/Slusho.png/revision/latest?cb=20080717173250', url: 'http://www.matthewrbrune.com' })
		.setDescription('These are the current scores of the M+ teams')
		.setThumbnail('https://static.wikia.nocookie.net/cloverfield/images/f/fb/Slusho.png/revision/latest?cb=20080717173250')
		.addFields(embedFormat)
		//.addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
		//.setImage('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter({ text: 'Written by Ice'});

		interaction.editReply({ embeds: [ exampleEmbed ]});
	},
};