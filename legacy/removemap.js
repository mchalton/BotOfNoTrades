const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removemap')
		.setDescription('Removes a Map from the Pool')
		.addStringOption(option => option.setName('workshopid').setDescription('Enter a Workshop ID').setRequired(true)),


	async execute(interaction) {

		workshopid = interaction.options.getString('workshopid');

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


			// Deleting map
			db.run(`DELETE FROM pool WHERE workshopID=?`, workshopid, function(err) {
				if (err) {
				return console.error(err.message);
				}
				console.log(`Row(s) deleted ${this.changes}`);
			});

			
			db.close((err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Close the database connection.');
			});


			// Embed 
			var removeEmbed = new EmbedBuilder()
				.setColor(0xFF6F00)
				.setTitle('Successfully Removed Map: ' + workshopid)
				.setTimestamp();

			await interaction.reply({ embeds: [removeEmbed]})

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

