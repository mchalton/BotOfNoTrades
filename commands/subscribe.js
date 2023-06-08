const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('subscribe')
		.setDescription('Subscribe to get notified by the Scheduler!'),

	async execute(interaction) {

		// open the database
		let db = new sqlite3.Database('./commands/database/subscribers.db', sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the database.');
		});

		// Adding sub
		db.run('INSERT INTO subscriber(userid) VALUES(?)', [interaction.user.id], (err) => {
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
		var subEmbed = new EmbedBuilder()
			.setColor(0xFF6F00)
			.setTitle('Subscribed to 10 Man Notificaiton')
			.setTimestamp();

		await interaction.reply(
			{ embeds: [subEmbed],
				ephemeral: true 
		});
	},
};

