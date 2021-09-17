const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Starts Change Time Vote!')
		.addIntegerOption(option => option.setName('timeout').setDescription('Enter number of minutes for voting').setRequired(true)),
        

	async execute(interaction) {
		// Embed 
		const mainEmbed = new MessageEmbed()
			.setThumbnail('https://imgur.com/vUG7MDU.png')
			.setColor('0xFF6F00')
			.setTitle('Change 10-Man Time Vote:')
			.setDescription('Vote from the dropdown')
			.addFields(
				{ name: '20:00:', value: '1' },
				{ name: '20:30:', value: '1' },
				{ name: '21:00:', value: '1' },
				{ name: '21:30:', value: '1' },
				{ name: '22:00:', value: '1' })
			.setFooter('Made By CommonCrayon', 'https://i.imgur.com/nuEpvJd.png');

		// dropdowns
		const dropdown = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('select')
					.setPlaceholder('Nothing selected')
					.addOptions([
						{label: '20:00', value: 'first_option'},
						{label: '20:30', value: 'second_option'},
						{label: '21:00', value: 'third_option'},
						{label: '21:30', value: 'fourth_option'},
						{label: '22:00', value: 'fifth_option'},
					]),
			);


		await interaction.reply(
			{ 
			embeds: [mainEmbed], 
			components: [dropdown],
		})

		console.log(`Vote triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

		const totalMinutes = interaction.options.getInteger('timeout');
		var interactionTimeout = (totalMinutes*60*1000);	// 30 Minutes + Minutes of the countdown * 60 to make into seconds * 1000 to make it into miliseconds

		const collector = interaction.channel.createMessageComponentCollector({ time: interactionTimeout }); 

		collector.on('collect', async i => {

			if ((i.values) === 'first_option') {
				await i.deferUpdate();
				await i.editReply(`<@${i.user.id}> Selected 20:00`);
			}

			else if ((i.values) === 'second_option') {
				await i.deferUpdate();
				await i.editReply(`<@${i.user.id}> Selected 20:30`);
			}

			else if ((i.values) === 'third_option') {
				await i.deferUpdate();
				await i.editReply(`<@${i.user.id}> Selected 21:00`);
			}

			else if ((i.values) === 'fourth_option') {
				await i.deferUpdate();
				await i.editReply(`<@${i.user.id}> Selected 21:30`);
			}

			else if ((i.values) === 'fifth_option') {
				await i.deferUpdate();
				await i.editReply(`<@${i.user.id}> Selected 22:00`);
			}
		});

		collector.on('end', async i => {
			console.log("Ended Vote");
		});
	}

};




