const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addmap')
		.setDescription('Adds a Map to the Pool')
		.addStringOption(option => option.setName('workshopid').setDescription('Enter the Workshop ID').setRequired(true))
		.addStringOption(option => option.setName('mapname').setDescription('Enter the Name of Map').setRequired(true)),


	async execute(interaction) {

		workshopid = interaction.options.getString('workshopid');
		mapname = interaction.options.getString('mapname');

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
			let db = new sqlite3.Database('./commands/database/10manpool.db', sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Connected to the database.');
			});


			// Adding map
			db.run('INSERT INTO pool(workshopID, mapName) VALUES(?, ?)', [workshopid, mapname], (err) => {
				if(err) {
					return console.log(err.message); 
				}
				console.log('Row was added to the table: ' + (this.lastID));
			})

			
			db.close((err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Close the database connection.');
			});


			// Embed 
			var addEmbed = new EmbedBuilder()
				.setColor(0xFF6F00)
				.setTitle('Successfully Added Map: ' + workshopid)
				.setTimestamp();

			await interaction.reply(
				{ embeds: [addEmbed],
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

