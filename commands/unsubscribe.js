const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unsubscribe')
		.setDescription('Unsubscribe to not get notified by the Scheduler!'),

	async execute(interaction) {

		// open the database
		let db = new sqlite3.Database('./commands/database/subscribers.db', sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the database.');
		});

		// removing sub
		db.run(`DELETE FROM subscriber WHERE userid=?`, (interaction.user.id), function(err) {
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
		var subEmbed = new EmbedBuilder()
			.setColor(0xFF6F00)
			.setTitle('Unsubscribed to 10 Man Notificaiton')
			.setTimestamp();

		await interaction.reply(
			{ embeds: [subEmbed],
				ephemeral: true 
		});
	},
};

