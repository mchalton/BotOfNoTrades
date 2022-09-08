const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('5man')
		.setDescription('Run a 5 Man Queue!'),

	async execute(interaction) {
		console.log(`5man triggered by ${interaction.user.tag} in #${interaction.channel.name}.`);

		let yesEntry = [];
		let maybeEntry = [];
		let noEntry = [];

        // Embed 
        let mainEmbed = new MessageEmbed()
            .setColor('0xFF6F00')
            .setTitle('5 Man')
            .setDescription('Queue for a 5 Man!')
            .addFields(
                { name: '__Yes:__', value: 'Empty' , inline: true},
                { name: '__Maybe:__', value: 'Empty', inline: true },
                { name: '__No:__', value: 'Empty', inline: true },
                )
			.setTimestamp();

        
        // Buttons
        let buttons = new MessageActionRow()
            .addComponents(
                new MessageButton().setCustomId('yes5man').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
                new MessageButton().setCustomId('maybe5man').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🤷'),
                new MessageButton().setCustomId('no5man').setLabel('No').setStyle('DANGER').setEmoji('👎'),
				//new MessageButton().setCustomId("update").setStyle("SECONDARY").setEmoji("🔄")	
            );

        await interaction.reply({embeds: [mainEmbed], components: [buttons]});

		const interactionTimeout = (360 * 60 * 1000); // 6 hours
		const collector = interaction.channel.createMessageComponentCollector({time: interactionTimeout});

		collector.on('collect', async i => {

			try { await i.deferReply(); } 
			catch (error) { console.error("Skipping 'Interaction has already been acknowledged.' Error."); }

			user = (i.user.username);
			buttonClicked = (i.customId);
			console.log(`5man Button Clicked:\n   User: ${user}\n   ButtonClicked: ${buttonClicked}`);

			if (buttonClicked === "yes5man" ) {
				if (yesEntry.indexOf(user) > -1) yesEntry.splice(yesEntry.indexOf(user), 1);
				if (maybeEntry.indexOf(user) > -1) maybeEntry.splice(maybeEntry.indexOf(user), 1);
				if (noEntry.indexOf(user) > -1) noEntry.splice(noEntry.indexOf(user), 1);

				yesEntry.push(user);

				let [yesString, maybeString, noString] = createString(yesEntry, maybeEntry, noEntry); //array size
				let mainEmbed = createEmbed(yesString, maybeString, noString, yesEntry, maybeEntry, noEntry); 
				let buttons = createButton();

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "maybe5man" ) {
				if (yesEntry.indexOf(user) > -1) yesEntry.splice(yesEntry.indexOf(user), 1);
				if (maybeEntry.indexOf(user) > -1) maybeEntry.splice(maybeEntry.indexOf(user), 1);
				if (noEntry.indexOf(user) > -1) noEntry.splice(noEntry.indexOf(user), 1);

				maybeEntry.push(user);

				let [yesString, maybeString, noString] = createString(yesEntry, maybeEntry, noEntry);
				let mainEmbed = createEmbed(yesString, maybeString, noString, yesEntry, maybeEntry, noEntry); 
				let buttons = createButton();

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}

			else if (buttonClicked === "no5man") {
				if (yesEntry.indexOf(user) > -1) yesEntry.splice(yesEntry.indexOf(user), 1);
				if (maybeEntry.indexOf(user) > -1) maybeEntry.splice(maybeEntry.indexOf(user), 1);
				if (noEntry.indexOf(user) > -1) noEntry.splice(noEntry.indexOf(user), 1);

				noEntry.push(user);

				let [yesString, maybeString, noString] = createString(yesEntry, maybeEntry, noEntry);
				let mainEmbed = createEmbed(yesString, maybeString, noString, yesEntry, maybeEntry, noEntry); 
				let buttons = createButton(); 

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}
			else if (buttonClicked === "update") {
				let [yesString, maybeString, noString] = createString(yesEntry, maybeEntry, noEntry);
				let mainEmbed = createEmbed(yesString, maybeString, noString, yesEntry, maybeEntry, noEntry); 
				let buttons = createButton(); 

				await i.editReply({embeds: [mainEmbed], components: [buttons]});
			}
		});;
	},
};


function createEmbed(yesString, maybeString, noString, yesEntry, maybeEntry, noEntry) {
	let mainEmbed = new MessageEmbed()
        .setColor('0xFF6F00')
        .setTitle('5 Man')
        .setDescription('Queue for a 5 Man!')
        .addFields(
            { name: `__Yes(${yesEntry.length}):__`, value: yesString, inline: true},
            { name: `__Maybe(${maybeEntry.length}):__`, value: maybeString, inline: true },
            { name: `__No(${noEntry.length}):__`, value: noString, inline: true },
            )
		.setTimestamp();
	return mainEmbed;
}


function createButton() {
	let buttons = new MessageActionRow()
		.addComponents(
			new MessageButton().setCustomId('yes5man').setLabel('Yes').setStyle('SUCCESS').setEmoji('👍'),
			new MessageButton().setCustomId('maybe5man').setLabel('Maybe').setStyle('PRIMARY').setEmoji('🤷'),
			new MessageButton().setCustomId('no5man').setLabel('No').setStyle('DANGER').setEmoji('👎'),
			//new MessageButton().setCustomId("update").setStyle("SECONDARY").setEmoji("🔄")
		);
	return buttons;
}


function createString(yesEntry, maybeEntry, noEntry) {
	// For Yes
	if (yesEntry.length == 0) yesString = "Empty";
	else {
		yesString = "";
		for (let l = 0; l < yesEntry.length; l++) yesString = (yesString + yesEntry[l] + '\n');
	}

	// For Maybe
	if (maybeEntry.length == 0) maybeString = "Empty";
	else {
		maybeString = "";
		for (let l = 0; l < maybeEntry.length; l++) maybeString = (maybeString + maybeEntry[l] + '\n');
	}

	// For No
	if (noEntry.length == 0) noString = "Empty";
	else {
		noString = "";
		for (let l = 0; l < noEntry.length; l++) noString = (noString + noEntry[l] + '\n');
	}

	return [yesString, maybeString, noString];
}