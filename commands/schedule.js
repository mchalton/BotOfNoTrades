const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const admin = require('../shared/admin.js');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Schedules 10man!')
		.addStringOption(option => option.setName('time').setDescription('Enter a Time (20:30)').setRequired(true)),

	async execute(interaction) {		
		
		let yesList = [interaction.user.id];
		let maybeList = [];
		let noList = [];
		
		const timeScheduled = interaction.options.getString('time');		

		const getSubscribers = async () => {
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
				});
			}

			const data = await getData();

			let mentionSubs = ' ';
			data.forEach(element => {
				mentionSubs += ('<@' + element.userid + '> ');
			});

			db.close((err) => {
				if (err) console.error(err.message);
				console.log('Close the database connection.');
			});
			return mentionSubs;
		}

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
				
		const createEmbed = async (interaction) => {

			const createString = async (interaction) => {
				const getUserName = async (userID, interaction) => {
					const user = await interaction.channel.guild.members.fetch(userID);
					return user.displayName;
				}

				let yesString = "";
				let noString = "";
				// For Yes
				if (yesList.length == 0) {
					yesString = "Empty";
				}
				else {
					for (var l = 0; l < yesList.length; l++) {
						let username = await getUserName(yesList[l], interaction);
						if (maybeList.includes(yesList[l]))
							username += " 🔸";

						if (l == 9) {
							yesString = (yesString + username + '\n🔹➖➖➖➖🔹\n');
						}
						else {
							yesString = (yesString + username + '\n');
						}						
					}
				}

				// For No
				if (noList.length == 0) {
					noString = "Empty";
				} 
				else {
					for (var l = 0; l < noList.length; l++) {
						let username = await getUserName(noList[l], interaction);
						noString = (noString + username + '\n');
					}
				}

				return [yesString, noString];
			}

			let [yesString, noString] = await createString(interaction); //array size

			let [countdownHour, countdownMinute, totalMinutes, epochTime] = getCountdown(timeScheduled);

			const getCountdownOutput = () => {
				if (totalMinutes > 0) {
					if (countdownHour == 0) {
						return (`Starting in ${countdownMinute} Minutes`);
					}
					else {
						return (`Starting in ${countdownHour}H ${countdownMinute}M`);
					}
				}
				return (`Started!`);
			};

			const countdownOutput = getCountdownOutput();

			var mainEmbed = new EmbedBuilder()
				.setColor(0xFF6F00)
				.setTitle('10 Man')
				.setDescription('Join a 10 Man!')
				.addFields(
					{ name: 'Time:', value: `<t:${epochTime}>` },
					{ name: 'Countdown:', value: countdownOutput},
					{ name: `__Yes(${yesList.length}):__`, value: yesString, inline: true},
					{ name: `__No(${noList.length}):__`, value: noString, inline: true },
					{ name: '\u200b', value: "[Join Server](https://jont-connect.azurewebsites.net/api/connect?v=2)"})
					.setFooter({ text:`connect ${secretinfo.server.serverIP}:${secretinfo.server.serverPort}; password jont`});
			return mainEmbed;
		}

		const createButtons = () => {
			const [, , totalMinutes,] = getCountdown(timeScheduled)

			const yesButton = new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('👍');
			const maybeButton = new ButtonBuilder().setCustomId('maybe').setLabel('Maybe').setStyle(ButtonStyle.Primary);
			const noButton = new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('👎');
			const refreshButton = new ButtonBuilder().setCustomId("update").setStyle(ButtonStyle.Secondary).setEmoji("🔄");

			if (totalMinutes < 60 && totalMinutes > -15) { // less than 60 minutes and more than -15 minutes
				maybeButton.setDisabled(true);
			}
			else if (totalMinutes <= -15) { // less than -15 minutes, disable all
				yesButton.setDisabled(true);
				maybeButton.setDisabled(true);
				noButton.setDisabled(true);
				refreshButton.setDisabled(true);
			}

			var buttons = new ActionRowBuilder().addComponents(yesButton, maybeButton, noButton, refreshButton);
			return buttons;
		}

		const isAdmin = admin.isAdmin(interaction.user.id);        
        if (!isAdmin) {
			await admin.showPermissionDenied(interaction);
			return;
		}
		
		const subscribers = await getSubscribers();
		const mainEmbed = await createEmbed(interaction);
		const buttons = createButtons();		

		await interaction.reply({content: subscribers, embeds: [mainEmbed], components: [buttons]});
		
		console.log(`Schedule triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

		const reply = await interaction.fetchReply()
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
				let maybeString = "";				
				for(var i = 0; i < maybeList.length; i++) {
					maybeString += (`<@${maybeList[i]}> `)
				}
				if (maybeString != "") 
					await interaction.guild.channels.cache.get(`${secretinfo.channelID}`).send(`Select Yes or No for the 10 man: ${maybeString}`);
				maybeMsg1 = false;
			}
			if ((totalMinutes <= 60) && (maybeMsg2)) {
				// add to no list
				for(var i = 0; i < yesList.length; i++) {
					if (maybeList.includes(yesList[i])) {	
						noList.push(yesList[i]);	
					}
				}
				// remove from yes list
				yesList = yesList.filter((value) => { return !maybeList.includes(value); });

				let maybeString = ""
				for(var i = 0; i < maybeList.length; i++) {
					maybeString += (`<@${maybeList[i]}> `);
				}

				if (maybeString != "") {
					await interaction.guild.channels.cache.get(`${secretinfo.channelID}`).send(`Moved to No: ${maybeString}`);
				}

				// don't run again
				maybeMsg2 = false;				
			}

			let mainEmbed = await createEmbed(interaction);
			let buttons = createButtons();

			await reply.edit({embeds: [mainEmbed],components: [buttons]});

			if (totalMinutes >= -20) setTimeout(doUpdate, 60000); // stop updating when time 
			else console.log("Ending Update on Schedule Message");
		}
		setTimeout(doUpdate, 60000);

		const [, , totalMinutes,] = getCountdown(timeScheduled)
		const totalMinutesNum = totalMinutes;
		const interactionTimeout = (30 + totalMinutesNum) * 60 * 1000;
		const collector = reply.createMessageComponentCollector({time: interactionTimeout});

		collector.on('collect', async i => {		

			const onYesButton = () => {
				// remove from no and maybe list
				maybeList = maybeList.filter((id) => id != user);
				noList = noList.filter((id) => id != user);

				if (!yesList.includes(user))
					yesList.push(user);
			}
			const onMaybeButton = () => {				
				// remove from no list
				noList = noList.filter((id) => id != user );

				// should be in both yes and maybe
				if (!yesList.includes(user))
					yesList.push(user);				
				if (!maybeList.includes(user))
					maybeList.push(user);
			}
			const onNoButton = () => {				
				// remove from yes and maybe list
				yesList = yesList.filter((id) => id != user );
				maybeList = maybeList.filter((id) => id != user );

				if (!noList.includes(user))
					noList.push(user);
			}

			
			const user = i.user.id;
			const buttonClicked = (i.customId);

			doingUpdate = true;
			
			await i.deferUpdate();

			if (buttonClicked === "yes" ) {
				onYesButton();				
			}
			else if (buttonClicked === "maybe" ) {
				onMaybeButton();
			}
			else if (buttonClicked === "no") {
				onNoButton();
			}
			
			let mainEmbed = await createEmbed(i);
			let buttons = createButtons();

			await i.editReply({
				embeds: [mainEmbed],
				components: [buttons],
			});

			doingUpdate = false;
		});
	},
};

