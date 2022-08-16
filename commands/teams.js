const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('teams')
		.setDescription('Choose teams for 10man!')
		.addUserOption(option => option.setName('1').setDescription('Choose captain for team 1').setRequired(true))
        .addUserOption(option => option.setName('2').setDescription('Choose captain for team 2').setRequired(true))
		.addIntegerOption(option => option.setName('first').setDescription('Which team picks first?').setRequired(true)
		.addChoice('1', 1).addChoice('2', 2))
		.addStringOption(option => option.setName('count').setDescription('How many first picks?').setRequired(true)
		.addChoice('1', '1').addChoice('2', '2').addChoice('Any', 'Any')),

	async execute(interaction) {
        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) {
				adminCheck = true;
			}
		}
        
        if (!adminCheck) {
			// If user is not admin
			var deniedEmbed = new MessageEmbed().setColor('0xFF6F00').setTitle('Permission Denied').setDescription('Must be an Admin')
			await interaction.reply({ embeds: [deniedEmbed], ephemeral: true })
			return;	
		}		
	
		console.log(`Teams triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

        const captain1 = interaction.options.getUser('1');
        const captain2 = interaction.options.getUser('2');
		
		const firstPick = interaction.options.getInteger('first');
		
		let pickTeam1 = firstPick == 1;

		let picks = 0;
		let pickCounter = 0;
		let freePick = false;
		const pickOpt = interaction.options.getString('count');
		if (pickOpt == 'Any') {
			freePick = true;
		}
		else {
			picks = parseInt(pickOpt);
		}


		const testing = false;

		const channel1 = interaction.guild.channels.cache.get(secretinfo.voiceChannel1).members;
		const channel2 = interaction.guild.channels.cache.get(secretinfo.voiceChannel2).members;

		const mainChannel = channel1.size >= channel2.size ? secretinfo.voiceChannel1 : secretinfo.voiceChannel2;
		const otherChannel = channel1.size >= channel2.size ? secretinfo.voiceChannel2 : secretinfo.voiceChannel1;

		// get all users in voice channel
		const users = interaction.guild.channels.cache.get(mainChannel).members;
		const userNames = testing ? ["test1", "test2"] : users.map(user => user.displayName);
			
		// remove captains as available picks
		const c1Index = userNames.indexOf(captain1.username);
		if (c1Index != -1)
			userNames.splice(c1Index, 1);	
		const c2Index = userNames.indexOf(captain2.username);		
		if (c2Index != -1)
			userNames.splice(c2Index, 1);

		// setup teams
        let team1 = [];
        let team2 = [];
        team1.push(captain1.username);
        team2.push(captain2.username);

        const embed = createEmbed(team1, team2, userNames, {count: picks, freePick: freePick, pickTeam1: pickTeam1});
		const selector = createSelector(userNames);
		await interaction.reply({embeds: [embed], components: [selector]});

		const reply = await interaction.fetchReply();
		//await reply.edit({embeds: [embed]});
		const interactionTimeout = 600 * 1000;
		const collector = reply.createMessageComponentCollector({time: interactionTimeout});

		let followUps = [];
		let adminFollowUps = [];
		
		collector.on('collect', async i => {
			await i.deferUpdate();
			
			const itemClicked = (i.customId);
			const clicker = (i.user);

			if (itemClicked == 'select') {
				const selectedUser = i.values[0];	

				let permission = false;
				if (freePick && (clicker.id == captain1.id || clicker.id == captain2.id)) {			
					permission = true;
				}
				else if (pickTeam1 && clicker.id == captain1.id) {				
					permission = true;
				}
				else if (!pickTeam1 && clicker.id == captain2.id) {				
					permission = true;
				}
				
				if (!permission) {
					// check why not allowed
					var deniedString = (clicker.id != captain1.id && clicker.id != captain2.id) ? 
					'Not a captain' :
					'Wait your turn!';
					
					// already warned just reply
					for (const index in followUps) {
						const entry = followUps[index];
						if (entry.user == clicker.id) {
							i.editReply();
							return;
						}
					}

					// show warning to user
					const msg = await i.followUp({ content: deniedString, ephemeral: true });
					followUps.push({user: clicker.id, message: msg});
					
					return;
				}


				if (freePick) {
					if (clicker.id == captain1.id) {
						team1.push(selectedUser);
					}
					else if (clicker.id == captain2.id) {
						team2.push(selectedUser);
					}
				}
				else {
					if (pickTeam1)
						team1.push(selectedUser);
					else
						team2.push(selectedUser);
				}

				pickCounter++;
				// had all picks, swap to other team
				if (!freePick && pickCounter == picks) {
					pickCounter = 0; 
					pickTeam1 = !pickTeam1;
					picks = 2;
				}

				const index = userNames.indexOf(selectedUser);
				if (index != -1)
					userNames.splice(index, 1);	
					

				const embed = createEmbed(team1, team2, userNames, {count: picks, freePick: freePick, pickTeam1: pickTeam1});
				if (userNames.length != 0) {
					const selector = createSelector(userNames);
					await i.editReply({embeds: [embed], components: [selector]});
				}
				else 
				{
					const moveButton = createMoveButton();
					await i.editReply({embeds: [embed], components: [moveButton]});
				}
			} 
			else if (itemClicked == 'move') {
				let adminCheck = false;
				for (let i = 0; i < adminJson.admins.length; i++) {
					if ((adminJson.admins[i].userid) == (interaction.user.id)) {
						adminCheck = true;
					}
				}
				if (!adminCheck) {
					// only admins can move users
					var deniedString = 'Admins Only';
					
					// already warned just reply
					for (const index in adminFollowUps) {
						const entry = adminFollowUps[index];
						if (entry.user == clicker.id) {
							i.editReply();
							return;
						}
					}

					// show warning to user
					const msg = await i.followUp({ content: deniedString, ephemeral: true });
					adminFollowUps.push({user: clicker.id, message: msg});
					
					return;
				}

				// move team 2 to other channel
				const users = interaction.guild.channels.cache.get(mainChannel).members;
				for (const value of users.values()) {
					const isTeam2 = team2.includes(value.displayName);
					if (isTeam2) {
						value.voice.setChannel(otherChannel);
					}
				}
				const embed = createEmbed(team1, team2, userNames, {count: picks, freePick: freePick, pickTeam1: pickTeam1});
				await i.editReply({embeds: [embed], components: []});
			}
		});
	},
};


const createEmbed = (team1, team2, users, pick_options) => {
	const names1String = team1.join("\n");
	const names2String = team2.join("\n");

	if (users.length != 0) {
		let title = 'Choose Teams';
		let description = 'Selecting teams for 10-man';
		if (pick_options && !pick_options.freePick) {
			if (users.length < pick_options.count)
				pick_options.count = users.length;
			const num_string =pick_options.count.toString();
			if (pick_options.pickTeam1) {
				title = 'Team 1 Picking';
				description = 'Choose ' + num_string + ' player(s) for Team 1';
			}
			else {
				title = 'Team 2 Picking';
				description = 'Choose ' + num_string + ' player(s) for Team 2';
			}
		}
		const remainingString = users.join("\n");
		var mainEmbed = new MessageEmbed()
			.setColor('0xFF6F00')
			.setTitle(title)
			.setDescription(description)
			.addFields(
				{ name: `__     Team 1:     __`, value: names1String, inline: true},
				{ name: `__     Team 2:    __`, value: names2String, inline: true },
				{ name: '\u200B', value: '\u200B' },
				{ name: `__Players:__`, value: remainingString, inline: false });
		return mainEmbed;
	}
	else {
		var mainEmbed = new MessageEmbed()
			.setColor('0xFF6F00')
			.setTitle('Final Teams')
			.setDescription('Selected teams for 10-man')
			.addFields(
				{ name: `__     Team 1     __`, value: names1String, inline: true},
				{ name: `__     Team 2     __`, value: names2String, inline: true });
		return mainEmbed;
	}
}

const createMoveButton = () => {
	var buttons = new MessageActionRow().addComponents(
		new MessageButton().setCustomId('move').setLabel('Move Channels').setStyle('SUCCESS'));
	return buttons;
}

const createSelector = (users) => {

	let options = [];
	for (const index in users) {
		options.push({
			label: users[index],
			value: users[index]
		})
	}

	const row = new MessageActionRow()
		.addComponents(
			new MessageSelectMenu()
				.setCustomId('select')
				.setPlaceholder('Pick a player')
				.addOptions(options)
		);

	return row;
}