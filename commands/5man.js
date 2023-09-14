const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('5man')
		.setDescription('Run a 5 Man Queue!'),

	async execute(interaction) {
		console.log(`5man triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

		let yesEntry = [interaction.user.displayName];
		let noEntry = [];

		let [yesString, noString] = createString(yesEntry, noEntry);
		let mainEmbed = createEmbed(yesString, noString, yesEntry, noEntry);         
        let buttons = createButton()

        await interaction.reply({embeds: [mainEmbed], components: [buttons]});

		const interactionTimeout = (360 * 60 * 1000); // 6 hours
		const collector = interaction.channel.createMessageComponentCollector({time: interactionTimeout});

		collector.on('collect', async i => {

			await i.deferUpdate(); 

			const user = (i.user.displayName);
			const buttonClicked = (i.customId);
			console.log(`5man Button Clicked:\n   User: ${user}\n   ButtonClicked: ${buttonClicked}`);

			if (buttonClicked === "yes5man" ) {				
				if (yesEntry.indexOf(user) > -1) {
					//return;
				}
				else if (yesEntry.indexOf(user + " 🔸") > -1) {
					yesEntry[yesEntry.indexOf(user + " 🔸")] = (user);
				}
				else if (noEntry.indexOf(user) > -1) {
					noEntry.splice(noEntry.indexOf(user), 1);
					yesEntry.push(user);
				}
				else {
					yesEntry.push(user);
				}

				let [yesString, noString] = createString(yesEntry, noEntry); //array size
				let mainEmbed = createEmbed(yesString, noString, yesEntry, noEntry); 
				let buttons = createButton();

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "maybe5man" ) {
				
				if (yesEntry.indexOf(user) > -1) {
					yesEntry[yesEntry.indexOf(user)] = (user + " 🔸");
				}
				else if (yesEntry.indexOf(user + " 🔸") > -1) {
					//return;
				}
				else if (noEntry.indexOf(user) > -1) {
					noEntry.splice(noEntry.indexOf(user), 1);
					yesEntry.push(user + " 🔸");
				}
				else {
					yesEntry.push(user + " 🔸");
				}
				
				let [yesString, noString] = createString(yesEntry, noEntry);
				let mainEmbed = createEmbed(yesString, noString, yesEntry, noEntry); 
				let buttons = createButton();

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "no5man") {				
				if (yesEntry.indexOf(user) > -1) {
					yesEntry.splice(yesEntry.indexOf(user), 1);
					noEntry.push(user);
				}
				else if (yesEntry.indexOf(user + " 🔸") > -1)  {
					yesEntry.splice(yesEntry.indexOf(user + " 🔸"), 1);
					noEntry.push(user);
				}
				else if (noEntry.indexOf(user) > -1) {
					//return;
				}
				else {
					noEntry.push(user);
				}

				let [yesString, noString] = createString(yesEntry, noEntry);
				let mainEmbed = createEmbed(yesString, noString, yesEntry, noEntry); 
				let buttons = createButton(); 

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}
		});;
	},
};


function createEmbed(yesString, noString, yesEntry, noEntry) {
	let mainEmbed = new EmbedBuilder()
        .setColor(0xFF6F00)
        .setTitle('5 Man')
        .setDescription("Looking for people to play with!")
        .addFields(
            { name: `__Yes(${yesEntry.length}):__`, value: yesString, inline: true},
            { name: `__No(${noEntry.length}):__`, value: noString, inline: true },
            )
		.setTimestamp();
	return mainEmbed;
}


function createButton() {
	let buttons = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder().setCustomId('yes5man').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('👍'),
			new ButtonBuilder().setCustomId('maybe5man').setLabel('Maybe').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('no5man').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('👎'),
		);
	return buttons;
}


function createString(yesEntry, noEntry) {
	// For Yes
	if (yesEntry.length == 0) yesString = "Empty";
	else {
		yesString = "";
		for (let l = 0; l < yesEntry.length; l++) yesString = (yesString + yesEntry[l] + '\n');
	}

	// For No
	if (noEntry.length == 0) noString = "Empty";
	else {
		noString = "";
		for (let l = 0; l < noEntry.length; l++) noString = (noString + noEntry[l] + '\n');
	}

	return [yesString, noString];
}