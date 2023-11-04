const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spinmap')
		.setDescription('Gets One Random Map'),


	async execute(interaction) {

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}
        
        if (adminCheck) {
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
					
					const random = Math.floor(Math.random() * data.length);
					const map = (data[random]);

					
					resolve(map);
				})
			}

			const map = await getMap();
			var mapID = String(map.id);
			var mapIDField = String('Workshop ID: ' + map.id);
			var mapName = String(map.name);
			
			db.close((err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Close the database connection.');
			});


			// Embed 
			var poolEmbed = new EmbedBuilder()
				.setColor(0xFF6F00)
				.setTitle('Retrieved Map: ' + mapName)
				.setURL('https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(mapID))
				.setDescription('Workshop ID: ' + mapID)
				.setTimestamp();

				
			await interaction.reply(
				{ embeds: [poolEmbed],
			})

		} else {
			// Missing Perms 
			var deniedEmbed = new EmbedBuilder()
				.setColor(0xFF6F00)
				.setTitle('Permission Denied')
				.setDescription('Must be an Admin')

			await interaction.reply(
				{
				embeds: [deniedEmbed], 
				ephemeral: true 
			})
		}
	},
};

