const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('teams')
		.setDescription('Choose teams for 10man!')
		.addUserOption(option => option.setName('1').setDescription('Choose captain for team 1').setRequired(true))
        .addUserOption(option => option.setName('2').setDescription('Choose captain for team 2').setRequired(true)),

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

        var testEmbed = new MessageEmbed().setColor('0xFF6F00').setTitle('Wow').setDescription('Message received');		
		console.log(`Teams triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

        const captain1 = interaction.options.getUser('1');
        const captain2 = interaction.options.getUser('2');

        let team1 = [];
        let team2 = [];

        team1.push(captain1);
        team2.push(captain2);
        createEmbed(team1, team2);
		//const reply = await interaction.fetchReply();
		//const interactionTimeout = 600 * 1000;
		//const collector = reply.createMessageComponentCollector({time: interactionTimeout});

		/*timeScheduled = interaction.options.getString('time');	//Getting String for timeScheduled posted in Time embed.

		let reply = await interaction.fetchReply()
		let doingUpdate = false;
		let maybeMsg1 = true;
		let maybeMsg2 = true;

		const doUpdate = async () => {
			if (doingUpdate) {// doing update, try again later
				setTimeout(doUpdate, 1000);
				console.log('Skipping update');
				return;
			}

			const [, , totalMinutes,] = getCountdown(timeScheduled)
			
			if ((totalMinutes <= 60) && (maybeMsg1)) {
				let maybeString = ""
				for (element in maybeMention) {maybeString += (`<@${maybeMention[element]}> `)}
				if (maybeString != "") await interaction.guild.channels.cache.get(`${secretinfo.channelID}`).send(`Select Yes or No for the 10 man: ${maybeString}`);
				maybeMsg1 = false;
			}

			if ((totalMinutes <= 30) && (maybeMsg2)) {
				let maybeString = ""

				function checkMaybe(yesEntry) {
					for (element in yesEntry) {
						if ((yesEntry[element]).includes('🔸')) {
							return true;
						}
					}
					return false;
				}

				do {
					for (element in yesEntry) {
						if ((yesEntry[element]).includes('🔸')) {
							
							let nopush = yesEntry[element];
		
							yesEntry.splice(element, 1);
							noEntry.push(nopush.slice(0, -3));
						}
					}
				} while (checkMaybe(yesEntry));

				for (element in maybeMention) {maybeString += (`<@${maybeMention[element]}> `)}
				if (maybeString != "") await interaction.guild.channels.cache.get(`${secretinfo.channelID}`).send(`Moved to No: ${maybeString}`);
				maybeMsg2 = false;
			}

			let [yesString, noString] = createString(yesEntry, noEntry); //array size
			let mainEmbed = createEmbed(yesString, noString, timeScheduled, yesEntry, noEntry);
			let buttons = createButton();

			await reply.edit({embeds: [mainEmbed],components: [buttons]});

			if (totalMinutes >= -20) setTimeout(doUpdate, 60000); // stop updating when time 
			else console.log("Ending Update on Schedule Message");
		}
		setTimeout(doUpdate, 60000);

		const totalMinutesNum = totalMinutes;
		const interactionTimeout = (30 + totalMinutesNum) * 60 * 1000;
		const collector = reply.createMessageComponentCollector({time: interactionTimeout});

		collector.on('collect', async i => {

			doingUpdate = true;
			
			user = (i.user.username);
			buttonClicked = (i.customId);

			user = assignPriority(user);

			if (buttonClicked === "yes" ) {
				await i.deferUpdate();

				if (yesEntry.indexOf(user) > -1) return;

				else if (yesEntry.indexOf(user + " 🔸") > -1) {
					yesEntry[yesEntry.indexOf(user + " 🔸")] = user;
					if ((maybeMention.indexOf(i.user.id)) !== -1) maybeMention.splice((maybeMention.indexOf(i.user.id)), 1);
				}

				else if (noEntry.indexOf(user) > -1) {
					noEntry.splice(noEntry.indexOf(user), 1);
					yesEntry.push(user);
				}

				else yesEntry.push(user);

				
				let [yesString, noString] = createString(yesEntry, noEntry); //array size
				let mainEmbed = createEmbed(yesString, noString, timeScheduled, yesEntry, noEntry); 
				let buttons = createButton(); 

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "maybe" ) {
				await i.deferUpdate();

				if (yesEntry.indexOf(user) > -1) {
					yesEntry[yesEntry.indexOf(user)] = (user + " 🔸");
					maybeMention.push(i.user.id);
				}

				else if (yesEntry.indexOf(user + " 🔸") > -1) return;

				else if (noEntry.indexOf(user) > -1) {
					noEntry.splice(noEntry.indexOf(user), 1);
					yesEntry.push(user + " 🔸");
					maybeMention.push(i.user.id);
				}

				else {
					yesEntry.push(user + " 🔸");
					maybeMention.push(i.user.id);
				}

				let [yesString, noString] = createString(yesEntry, noEntry);
				let mainEmbed = createEmbed(yesString, noString, timeScheduled, yesEntry, noEntry); 
				let buttons = createButton();

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "no") {
				await i.deferUpdate();

				if (yesEntry.indexOf(user) > -1) {
					yesEntry.splice(yesEntry.indexOf(user), 1);
					noEntry.push(user);
				}

				else if (yesEntry.indexOf(user + " 🔸") > -1) {
					yesEntry.splice(yesEntry.indexOf(user + " 🔸"), 1);
					noEntry.push(user);
					if ((maybeMention.indexOf(i.user.id)) !== -1) maybeMention.splice((maybeMention.indexOf(i.user.id)), 1);
				}

				else if (noEntry.indexOf(user) > -1) return;
				else noEntry.push(user);

				let [yesString, noString] = createString(yesEntry, noEntry);
				let mainEmbed = createEmbed(yesString, noString, timeScheduled, yesEntry, noEntry); 
				let buttons = createButton(); 

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}
			doingUpdate = false;
		});*/
	},
};


function createEmbed(team1, team2) {
    let names1 = team1.map(user => user.username);
    let names2 = team2.map(user => user.username);

	var mainEmbed = new MessageEmbed()
		.setColor('0xFF6F00')
		.setTitle('Choose Teams')
		.setDescription('Selecting teams for 10-man')
		.addFields(
			{ name: `__Team 1__`, value: names1, inline: true},
			{ name: `__Team 2__`, value: names2, inline: true });
	return mainEmbed;
}


function createButton() {
	const [, , totalMinutes,] = getCountdown(timeScheduled)

	if (totalMinutes > 60 ) {
		var buttons = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
			new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸'),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎'));
	}

	else if (totalMinutes > -15) {
		var buttons = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
			new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸').setDisabled(true),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎'));
	}

	else {
		var buttons = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍').setDisabled(true),
			new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸').setDisabled(true),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎').setDisabled(true));
	}
	return buttons;
}


function createString(yesEntry, noEntry) {
	// For Yes
	if (yesEntry.length == 0) yesString = "Empty";
	else {
		yesString = "";
		for (var l = 0; l < yesEntry.length; l++) {
			if (l == 9) {
				yesString = (yesString + yesEntry[l] + '\n🔹➖➖➖➖🔹\n');
			}
			else {
				yesString = (yesString + yesEntry[l] + '\n');
			}
			
		}
	}

	// For No
	if (noEntry.length == 0) noString = "Empty";
	else {
		noString = "";
		for (var l = 0; l < noEntry.length; l++) {
			noString = (noString + noEntry[l] + '\n');
		}
	}

	return [yesString, noString];
}


function getCountdown(timeScheduled) {
    const scheduledTimeArray = timeScheduled.split(":");

    var d = new Date();
    var cetHour = d.getUTCHours();  //CHANGE FOR CET/CEST
    var cetMinute = d.getUTCMinutes();
    
    var cetTime = (cetHour*60 + cetMinute);
    
    var integerUTCHour = parseInt(scheduledTimeArray[0], 10);
    var integerUTCMin = parseInt(scheduledTimeArray[1], 10);
    var integerCET = parseInt(cetTime, 10);
    
    scheduledMinutes = (integerUTCHour*60 + integerUTCMin);
    
    totalMinutes = (scheduledMinutes - integerCET);
    
    countdownHour = Math.floor(totalMinutes / 60);
    countdownMinute = (totalMinutes - countdownHour*60);

	// Get Epoch Time
	var epochTime = new Date();
	epochTime.setHours(integerUTCHour, integerUTCMin, 0, 0); // CET/CEST might change things!
	var epochTime = String(epochTime.getTime());
	epochTime = epochTime.slice(0, -3)

    return [countdownHour, countdownMinute, totalMinutes, epochTime];
}
