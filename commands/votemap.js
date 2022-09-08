const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageEmbed, MessageSelectMenu } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('votemap')
		.setDescription('Vote on 5 Random Maps'),


	async execute(interaction) {

        // GETTING ADMIN LIST
		// open the database
		let db = new sqlite3.Database('./commands/database/admins.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
              console.error(err.message);
            }
            console.log('Connected to the database.');
        });
  
  
        // Getting all the rows in the database
        function getData() {
            return new Promise((resolve, reject) => {
                db.all(`SELECT userid as id FROM admins`, (err, row) => {
                    if (err) { reject(err); }
                    resolve(row);
                });
            })
        }
  
        const data = await getData();

        function getAdmins(data) {
            return new Promise((resolve) => {
                var admin = [];
                for (const item of data) {
                    admin.push(item.id)
                }
                resolve(admin);
            })
        }
  
        const admin = await getAdmins(data);
          
        db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Close the database connection.');
        });
		
        
        if (admin.includes(interaction.user.id)) {

			// open the database
			let db = new sqlite3.Database('./commands/database/10manpool.db', sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Connected to the database.');
			});


			// Getting all the rows in the database
			function getData() {
				return new Promise((resolve, reject) => {
					db.all(`SELECT workshopID as id, mapName as name FROM pool`, (err, row) => {
						if (err) { reject(err); }
						resolve(row);
					});
				})
			}

			const data = await getData();

			function getMap() {
				return new Promise((resolve) => {

					var mapList = [];

					for (let i = 0; i < 5; i++) {

						const random = Math.floor(Math.random() * data.length);
						const map = (data[random]);

						while (map in mapList) {
							const random = Math.floor(Math.random() * data.length);
							const map = (data[random]);
						}

						mapList.push(map)
					}
		
					resolve(mapList);
				})
			}

			const mapList = await getMap();
			
			db.close((err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Close the database connection.');
			});

			map1 = mapList[0];
			map2 = mapList[1];
			map3 = mapList[2];
			map4 = mapList[3];
			map5 = mapList[4];


			// Embed 
			var poolEmbed = new MessageEmbed()
				.setColor('0xFF6F00')
				.setTitle('Vote on Map to Play!')
				.addFields(
					{ name: '🔸\n' + String(map1.name) + '\n' + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map1.id), value: '\u200b'},
					{ name: '🔸\n' + String(map2.name) + '\n'  + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map2.id), value: '\u200b'},
					{ name: '🔸\n' + String(map3.name) + '\n'  + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map3.id), value: '\u200b'},
					{ name: '🔸\n' + String(map4.name) + '\n'  + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map4.id), value: '\u200b'},
					{ name: '🔸\n' + String(map5.name) + '\n'  + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map5.id), value: '\u200b'})
				.setTimestamp();

			const dropdown = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('select')
					.setPlaceholder('Nothing selected')
					.addOptions([
						{label: String(map1.name), value: 'first_option'},
						{label: String(map2.name), value: 'second_option'},
						{label: String(map3.name), value: 'third_option'},
						{label: String(map4.name), value: 'fourth_option'},
						{label: String(map5.name), value: 'fifth_option'},
					])
			);
				
			await interaction.reply(
				{ embeds: [poolEmbed],
				components: [dropdown],
			})

		} else {
			// Missing Perms 
			var deniedEmbed = new MessageEmbed()
				.setColor('0xFF6F00')
				.setTitle('Permission Denied')
				.setDescription('Must be an Admin')

			await interaction.reply(
				{
				embeds: [deniedEmbed], 
				ephemeral: true 
			})
		}

		var firstOption = [];
		var secondOption = [];
		var thirdOption = [];
		var fourthOption = [];
		var fifthOption = [];

		var interactionTimeout = (12*60*60*1000);	// 12 hours into milliseconds

		const collector = interaction.channel.createMessageComponentCollector({ time: interactionTimeout }); 

		collector.on('collect', async i => {

			var optionSelected = (i.values);
			var user = (`<@${i.user.id}>`);

			console.log(`${user} selected ${optionSelected}`);

			if ((i.values) == 'first_option') {
				await i.deferUpdate();

				if (firstOption.indexOf(user) > -1) {
					firstOption.splice(firstOption.indexOf(user), 1);
				}
				else {
					firstOption.push(user);
				}

				let [firstString, secondString, thirdString, fourthString, fifthString] = createString(firstOption, secondOption, thirdOption, fourthOption, fifthOption);
				let poolEmbed = createEmbed(firstString, secondString, thirdString, fourthString, fifthString);

				await i.editReply({embeds: [poolEmbed]}) 
			}

			else if ((i.values) == 'second_option') {
				await i.deferUpdate();

				if (secondOption.indexOf(user) > -1) {
					secondOption.splice(secondOption.indexOf(user), 1);
				}
				else {
					secondOption.push(user);
				}

				let [firstString, secondString, thirdString, fourthString, fifthString] = createString(firstOption, secondOption, thirdOption, fourthOption, fifthOption);
				let poolEmbed = createEmbed(firstString, secondString, thirdString, fourthString, fifthString);

				await i.editReply({embeds: [poolEmbed]}) 
			}

			else if ((i.values) == 'third_option') {
				await i.deferUpdate();

				if (thirdOption.indexOf(user) > -1) {
					thirdOption.splice(thirdOption.indexOf(user), 1);
				}
				else {
					thirdOption.push(user);
				}

				let [firstString, secondString, thirdString, fourthString, fifthString] = createString(firstOption, secondOption, thirdOption, fourthOption, fifthOption);
				let poolEmbed = createEmbed(firstString, secondString, thirdString, fourthString, fifthString);

				await i.editReply({embeds: [poolEmbed]}) 
			}

			else if ((i.values) == 'fourth_option') {
				await i.deferUpdate();

				if (fourthOption.indexOf(user) > -1) {
					fourthOption.splice(fourthOption.indexOf(user), 1);
				}
				else {
					fourthOption.push(user);
				}

				let [firstString, secondString, thirdString, fourthString, fifthString] = createString(firstOption, secondOption, thirdOption, fourthOption, fifthOption);
				let poolEmbed = createEmbed(firstString, secondString, thirdString, fourthString, fifthString);

				await i.editReply({embeds: [poolEmbed]}) 
			}

			else if ((i.values) == 'fifth_option') {
				await i.deferUpdate();

				if (fourthOption.indexOf(user) > -1) {
					fourthOption.splice(fourthOption.indexOf(user), 1);
				}
				else {
					fifthOption.push(user);
				}

				let [firstString, secondString, thirdString, fourthString, fifthString] = createString(firstOption, secondOption, thirdOption, fourthOption, fifthOption);
				let poolEmbed = createEmbed(firstString, secondString, thirdString, fourthString, fifthString);

				await i.editReply({embeds: [poolEmbed]}) 
			}
		});

		collector.on('end', async i => {
			console.log("Ended Vote");
		});
	},
};


function createEmbed(firstOption, secondOption, thirdOption, fourthOption, fifthOption) {

	const poolEmbed = new MessageEmbed()
	.setColor('0xFF6F00')
	.setTitle('Vote on a Map to Play!')
	.addFields(
		{ name: '🔸\n' + String(map1.name) + '\n' + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map1.id), value: firstOption },
		{ name: '🔸\n' + String(map2.name) + '\n' + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map2.id), value: secondOption },
		{ name: '🔸\n' + String(map3.name) + '\n' + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map3.id), value: thirdOption },
		{ name: '🔸\n' + String(map4.name) + '\n' + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map4.id), value: fourthOption },
		{ name: '🔸\n' + String(map5.name) + '\n' + 'https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(map5.id), value: fifthOption })
	.setTimestamp();
	return poolEmbed;
}


function createString(firstOption, secondOption, thirdOption, fourthOption, fifthOption) {
	if (firstOption.length == 0){
		firstString = '\u200b';
	}
	else {
		firstString = "";
		for (var l = 0; l < firstOption.length; l++) {
			firstString = (firstString + firstOption[l] + ' ');
		}
	}

	if (secondOption.length == 0){
		secondString = '\u200b';
	}
	else {
		secondString = "";
		for (var l = 0; l < secondOption.length; l++) {
			secondString = (secondString + secondOption[l] + ' ');
		}
	}

	if (thirdOption.length == 0){
		thirdString = '\u200b';
	}
	else {
		thirdString = "";
		for (var l = 0; l < thirdOption.length; l++) {
			thirdString = (thirdString + thirdOption[l] + ' ');
		}
	}

	if (fourthOption.length == 0){
		fourthString = '\u200b';
	}
	else {
		fourthString = "";
		for (var l = 0; l < fourthOption.length; l++) {
			fourthString = (fourthString + fourthOption[l] + ' ');
		}
	}

	if (fifthOption.length == 0){
		fifthString = '\u200b';
	}
	else {
		fifthString = "";
		for (var l = 0; l < fifthOption.length; l++) {
			fifthString = (fifthString + fifthOption[l] + ' ');
		}
	}

	return [firstString, secondString, thirdString, fourthString, fifthString];
}