const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedules 10man!')
		.addStringOption(option => option.setName('time').setDescription('Enter a Time (20:30)').setRequired(true)),

	async execute(interaction) {		

		const getCountdown = (timeScheduled) => {
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

				
		const createEmbed = async (timeScheduled, yesEntry, noEntry, maybeMention, interaction) => {

			const createString = async (yesEntry, noEntry, maybeMention, interaction) => {
				const getUserName = async (userID, interaction) => {
					await interaction.channel.guild.members.fetch(userID).then((user) => {
						return user.user.username;
					});
				}

				// For Yes
				if (yesEntry.length == 0) yesString = "Empty";
				else {
					yesString = "";
					for (var l = 0; l < yesEntry.length; l++) {

						let username = await getUserName(yesEntry[l], interaction);
						if (maybeMention.includes(yesEntry[l]))
							username += " 🔸"

						if (l == 9) {
							yesString = (yesString + username + '\n🔹➖➖➖➖🔹\n');
						}
						else {
							yesString = (yesString + username + '\n');
						}
						
					}
				}

				// For No
				if (noEntry.length == 0) noString = "Empty";
				else {
					noString = "";
					for (var l = 0; l < noEntry.length; l++) {
						let username = await getUserName(noEntry[l], interaction);
						noString = (noString + username + '\n');
					}
				}

				return [yesString, noString];
			}

			let [yesString, noString] = await createString(yesEntry, noEntry, maybeMention, interaction); //array size

			let [countdownHour, countdownMinute, totalMinutes, epochTime] = getCountdown(timeScheduled);

			if (totalMinutes > 0) {
				if (countdownHour == 0) {var countdownOutput = (`Starting in ${countdownMinute} Minutes`);}
				else {var countdownOutput = (`Starting in ${countdownHour}H ${countdownMinute}M`);}
			}
			else {var countdownOutput = (`Started!`);}

			var mainEmbed = new EmbedBuilder()
				.setColor(0xFF6F00)
				.setTitle('10 Man')
				.setDescription('Join a 10 Man!')
				.addFields(
					{ name: 'Time:', value: `<t:${epochTime}>` },
					{ name: 'Countdown:', value: countdownOutput},
					{ name: `__Yes(${yesEntry.length}):__`, value: yesString, inline: true},
					{ name: `__No(${noEntry.length}):__`, value: noString, inline: true },
					{ name: '\u200b', value: "[Join Server](https://jont-connect.azurewebsites.net/api/connect?v=2)"})
					.setFooter({ text:`connect ${secretinfo.server.serverIP}:${secretinfo.server.serverPort}; password jont`});
			return mainEmbed;
		}


		const createButton = (timeScheduled) => {
			const [, , totalMinutes,] = getCountdown(timeScheduled)

			if (totalMinutes > 60 ) {
				var buttons = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('👍'),
					new ButtonBuilder().setCustomId('maybe').setLabel('Maybe').setStyle(ButtonStyle.Primary),
					new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('👎'),
					new ButtonBuilder().setCustomId("update").setStyle(ButtonStyle.Secondary).setEmoji("🔄"));
			}

			else if (totalMinutes > -15) {
				var buttons = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('👍'),
					new ButtonBuilder().setCustomId('maybe').setLabel('Maybe').setStyle(ButtonStyle.Primary).setDisabled(true),
					new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('👎'),
					new ButtonBuilder().setCustomId("update").setStyle(ButtonStyle.Secondary).setEmoji("🔄"));
			}

			else {
				var buttons = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('👍').setDisabled(true),
					new ButtonBuilder().setCustomId('maybe').setLabel('Maybe').setStyle(ButtonStyle.Primary).setDisabled(true),
					new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('👎').setDisabled(true),
					new ButtonBuilder().setCustomId("update").setStyle(ButtonStyle.Secondary).setEmoji("🔄").setDisabled(true));
			}
			//🔸
			return buttons;
		}


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
			var deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin')
			await interaction.reply({ embeds: [deniedEmbed], ephemeral: true })
			return;
		}
		
		let timeScheduled = interaction.options.getString('time');
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
		
		let mentionSubs = ' '
		data.forEach(element => {
			mentionSubs += ('<@' + element.userid + '> ');
		});

		db.close((err) => {
			if (err) console.error(err.message);
			console.log('Close the database connection.');
		});
		
		let yesEntry = [interaction.user.id];
		let maybeMention = [];
		let noEntry = [];


		let mainEmbed = await createEmbed(timeScheduled, yesEntry, noEntry, maybeMention, interaction);
		
		// Buttons
		var buttons = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('👍'),
			new ButtonBuilder().setCustomId('maybe').setLabel('Maybe').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('👎'),
			new ButtonBuilder().setCustomId("update").setStyle(ButtonStyle.Secondary).setEmoji("🔄")
			);

		await interaction.reply({content: mentionSubs, embeds: [mainEmbed], components: [buttons]});
		
		console.log(`Schedule triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

		let reply = await interaction.fetchReply()
		let doingUpdate = false;
		let maybeMsg1 = true;
		let maybeMsg2 = true;

		const doUpdate = async () => {
			if (doingUpdate) {// doing update, try again later
				setTimeout(doUpdate, 1000);
				return;
			}

			const [, , totalMinutes,] = getCountdown(timeScheduled)
			
			if ((totalMinutes <= 120) && (maybeMsg1)) {
				let maybeString = ""
				for (element in maybeMention) {maybeString += (`<@${maybeMention[element]}> `)}
				if (maybeString != "") await interaction.guild.channels.cache.get(`${secretinfo.channelID}`).send(`Select Yes or No for the 10 man: ${maybeString}`);
				maybeMsg1 = false;
			}

			if ((totalMinutes <= 60) && (maybeMsg2)) {
				// add to no list
				for(var i = 0; i < yesEntry.length; i++) {
					if (maybeMention.includes(yesEntry[i])) {	
						noEntry.push(yesEntry[i]);	
					}
				}
				// remove from yes list
				yesEntry = yesEntry.filter((value) => { return !maybeMention.includes(value); });

				let maybeString = ""
				for(var i = 0; i < maybeMention.length; i++) {
					maybeString += (`<@${maybeMention[i]}> `);
				}

				if (maybeString != "") {
					await interaction.guild.channels.cache.get(`${secretinfo.channelID}`).send(`Moved to No: ${maybeString}`);
				}

				// don't run again
				maybeMsg2 = false;				
			}

			let mainEmbed = await createEmbed(timeScheduled, yesEntry, noEntry, maybeMention, i);
			let buttons = createButton(timeScheduled);

			await reply.edit({embeds: [mainEmbed],components: [buttons]});

			if (totalMinutes >= -20) setTimeout(doUpdate, 60000); // stop updating when time 
			else console.log("Ending Update on Schedule Message");
		}
		setTimeout(doUpdate, 60000);

		const totalMinutesNum = totalMinutes;
		const interactionTimeout = (30 + totalMinutesNum) * 60 * 1000;
		const collector = reply.createMessageComponentCollector({time: interactionTimeout});

		collector.on('collect', async i => {

			let doingUpdate = true;
			
			const user = i.user.id;
			const buttonClicked = (i.customId);

			if (buttonClicked === "yes" ) {
				await i.deferUpdate();

				// remove from no and maybe list
				maybeMention = maybeMention.filter((id) => id != user );
				noEntry = noEntry.filter((id) => id != user );

				if (!yesEntry.includes(user))
					yesEntry.push(user);
				
				let mainEmbed = await createEmbed(timeScheduled, yesEntry, noEntry, maybeMention, i); 
				let buttons = createButton(timeScheduled); 

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "maybe" ) {
				await i.deferUpdate();

				// remove from no list
				noEntry = noEntry.filter((id) => id != user );

				// should be in both yes and maybe
				if (!yesEntry.includes(user))
					yesEntry.push(user);				
				if (!maybeMention.includes(user))
					maybeMention.push(user);

				let mainEmbed = await createEmbed(timeScheduled, yesEntry, noEntry, maybeMention, i); 
				let buttons = createButton(timeScheduled);

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "no") {
				await i.deferUpdate();

				// remove from yes and maybe list
				yesEntry = yesEntry.filter((id) => id != user );
				maybeMention = maybeMention.filter((id) => id != user );

				if (!noEntry.includes(user))
					noEntry.push(user);

				let mainEmbed = await createEmbed(timeScheduled, yesEntry, noEntry, maybeMention, i); 
				let buttons = createButton(timeScheduled); 

				await i.editReply({
					embeds: [mainEmbed], 
					components: [buttons]
				});
			}
			else if (buttonClicked === "update") {
				await i.deferUpdate();

				let mainEmbed = await createEmbed(timeScheduled, yesEntry, noEntry, maybeMention, i);
				let buttons = createButton(timeScheduled);

				await i.editReply({
					embeds: [mainEmbed],
					components: [buttons],
				});
			}
			doingUpdate = false;
		});;
	},
};

