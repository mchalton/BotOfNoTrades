const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pool')
		.setDescription('Displays the Map Pool'),


	async execute(interaction) {

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
				db.all(`SELECT workshopID as id, mapName as name FROM pool ORDER BY name`, (err, row) => {
					if (err) { reject(err); }
					resolve(row);
				});
			})
		}

		const data = await getData();

		function getMapList() {
			return new Promise((resolve) => {
				var mapList = '';
				for (const item of data) {
					mapList += (item.name + ', ');
				}
				resolve(mapList);
			})
		}

		const mapList = await getMapList();
		
		db.close((err) => {
		  if (err) {
			console.error(err.message);
		  }
		  console.log('Close the database connection.');
		});


		// Embed 
		var poolEmbed = new EmbedBuilder()
			.setColor(0xFF6F00)
			.setTitle('10 Man Map Pool')
			.setURL('https://10man.commoncrayon.com/')
			.setDescription('Map Pool of ' + data.length + ' maps!')
			.addFields(
				{ name: 'Map:', value: mapList},
			)
			.setTimestamp();


			
		await interaction.reply(
			{ embeds: [poolEmbed],
		})
	},
};

