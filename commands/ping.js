const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Poke the bot to see if it's live!"),

	async execute(interaction) {
		// Embed 
		var subEmbed = new MessageEmbed()
			.setColor('0xFF6F00')
			.setTitle('Stop poking me :(')
			.setTimestamp();

		await interaction.reply(
			{ embeds: [subEmbed],
				ephemeral: true 
		});
	},
};

