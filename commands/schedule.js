const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedules 10man!')
		.addStringOption(option => option.setName('time').setDescription('Enter a Time (20:30)').setRequired(true)),

	async execute(interaction) {
        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) {
				adminCheck = true;
			}
		}
        
        if (adminCheck) {
			// open the database
			let db = new sqlite3.Database('./commands/database/subscribers.db', sqlite3.OPEN_READWRITE, (err) => {
				if (err) console.error(err.message);
				console.log('Connected to the database.');
			});
		
			// Getting all the rows in the database
			function getData() {
				return new Promise((resolve, reject) => {
					db.all(`SELECT userid FROM subscriber`, (err, row) => {
						if (err) { reject(err); }
						resolve(row);
					});
				})
			}
	
			const data = await getData();
			
			mentionSubs = ' '
			data.forEach(element => {
				mentionSubs += ('<@' + element.userid + '> ');
			});

			db.close((err) => {
				if (err) console.error(err.message);
				console.log('Close the database connection.');
			});
			
			var yesEntry = [assignPriority(interaction.user.username)];
			var maybeMention = [];
			var noEntry = [];

			timeScheduled = interaction.options.getString('time');

			var [countdownHour, countdownMinute, totalMinutes, epochTime] = getCountdown(timeScheduled);

			let [yesString, noString] = createString(yesEntry, noEntry); //array size

			// Embed 
			var mainEmbed = new MessageEmbed()
				.setColor('0xFF6F00')
				.setTitle('10 Man')
				.setURL('https://10man.commoncrayon.com/')
				.setDescription('Join a 10 Man!')
				.addFields(
					{ name: 'Time:', value: `<t:${epochTime}>`},
					{ name: 'Countdown:', value: `Starting in ${countdownHour}H ${countdownMinute}M`},
					{ name: `__Yes(${yesEntry.length}):__`, value: yesString, inline: true},
					{ name: `__No(${noEntry.length}):__`, value: noString, inline: true },
					{ name: '\u200b', value: "steam://connect/crayon.csgo.fr:27015/fun"})
				.setFooter({ text:'Server IP: connect crayon.csgo.fr:27015; password fun', iconURL: 'https://i.imgur.com/nuEpvJd.png'})

			
			// Buttons
			var buttons = new MessageActionRow().addComponents(
				new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
				new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸'),
				new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎'));

			await interaction.reply({content: mentionSubs, embeds: [mainEmbed], components: [buttons]});
		}
		 else {
			// If user is not admin
			var deniedEmbed = new MessageEmbed().setColor('0xFF6F00').setTitle('Permission Denied').setDescription('Must be an Admin')
			await interaction.reply({ embeds: [deniedEmbed], ephemeral: true })
			return;
		}
		
		console.log(`Schedule triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

		timeScheduled = interaction.options.getString('time');	//Getting String for timeScheduled posted in Time embed.

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

				await i.editReply({
					embeds: [mainEmbed], 
					components: [buttons]
				});
			}
			else if (buttonClicked === "update") {
				await i.deferUpdate();

				let [yesString, noString] = createString(yesEntry, noEntry);
				let mainEmbed = createEmbed(yesString, noString, timeScheduled, yesEntry, noEntry);
				let buttons = createButton();

				await i.editReply({
					embeds: [mainEmbed],
					components: [buttons],
				});
			}
			doingUpdate = false;
		});;
	},
};


function createEmbed(yesString, noString, timeScheduled, yesEntry, noEntry) {

	let [countdownHour, countdownMinute, totalMinutes, epochTime] = getCountdown(timeScheduled);

	if (totalMinutes > 0) {
		if (countdownHour == 0) {var countdownOutput = (`Starting in ${countdownMinute} Minutes`);}
		else {var countdownOutput = (`Starting in ${countdownHour}H ${countdownMinute}M`);}
	}
	else {var countdownOutput = (`Started!`);}

	var mainEmbed = new MessageEmbed()
		.setColor('0xFF6F00')
		.setTitle('10 Man')
		.setURL('https://10man.commoncrayon.com/')
		.setDescription('Join a 10 Man!')
		.addFields(
			{ name: 'Time:', value: `<t:${epochTime}>` },
			{ name: 'Countdown:', value: countdownOutput},
			{ name: `__Yes(${yesEntry.length}):__`, value: yesString, inline: true},
			{ name: `__No(${noEntry.length}):__`, value: noString, inline: true },
			{ name: '\u200b', value: "steam://connect/crayon.csgo.fr:27015/fun"})
		.setFooter({ text:'Server IP: connect crayon.csgo.fr:27015; password fun', iconURL: 'https://i.imgur.com/nuEpvJd.png'});
	return mainEmbed;
}


function createButton() {
	const [, , totalMinutes,] = getCountdown(timeScheduled)

	if (totalMinutes > 60 ) {
		var buttons = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
			new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸'),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎'),
			new MessageButton().setCustomId("update").setStyle("SECONDARY").setEmoji("🔄"));
	}

	else if (totalMinutes > -15) {
		var buttons = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
			new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸').setDisabled(true),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎'),
			new MessageButton().setCustomId("update").setStyle("SECONDARY").setEmoji("🔄"));
	}

	else {
		var buttons = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍').setDisabled(true),
			new MessageButton().setCustomId('maybe').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🔸').setDisabled(true),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER').setEmoji('👎').setDisabled(true),
			new MessageButton().setCustomId("update").setStyle("SECONDARY").setEmoji("🔄").setDisabled(true));
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

	const serverTime = new Date();
	const timeInEurope = new Date(serverTime.toLocaleString('en-US', { timeZone: 'Europe/Paris'}));
	const diff = timeInEurope.getTime() - serverTime.getTime();
	const hoursApprox = (diff / (1000 * 60 * 60));

	const hourOffset = Math.round(hoursApprox);


    var currServerTime = new Date();
    var currentHour = currServerTime.getHours();  //CHANGE FOR CET/CEST
    var currentMinute = currServerTime.getMinutes();
    
    var currentTime = (currentHour*60 + currentMinute);
    
    var scheduledHour = parseInt(scheduledTimeArray[0], 10)- hourOffset;
    var scheduledMinute = parseInt(scheduledTimeArray[1], 10);

    var currentTimeInt = parseInt(currentTime, 10);
    
    const scheduledTotalMin = ((scheduledHour )*60 + scheduledMinute);
    
    const diffMinutes = (scheduledTotalMin - currentTimeInt);
    
    countdownHour = Math.floor(diffMinutes / 60);
    countdownMinute = (diffMinutes - countdownHour*60);

	// Get Epoch Time
	var epochTime = new Date();
	epochTime.setHours(scheduledHour , scheduledMinute, 0, 0); // CET/CEST might change things!
	var epochTime = String(epochTime.getTime());
	epochTime = epochTime.slice(0, -3)

    return [countdownHour, countdownMinute, diffMinutes, epochTime];
}


function assignPriority(user) {
	const priority = [
		"Roald",
		"linkinblak",
		"QueeN",
		"DashBash",
		"Royal Bacon",
		"k0vac",
		"Amajha",
		"CaJeB3",
		"ShadowPoor",
		"Rik",
		"Jeppi",
		"Mini",
		"Porsche",
		"NinjaM0nk",
		"CommonCrayon",
		"Thisted",
	]; 

	for (var i = 0; i < priority.length; i++) {
		if (user === priority[i]) {user = "🎗️" + user};
	}
	return user;
}
