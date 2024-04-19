const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { decode } = require('html-entities');

module.exports = {
	data: new SlashCommandBuilder().setName('trivia').setDescription('Play a Trivia Question!'),

	async execute(interaction) {
		
		let category = "";
		let difficulty = "";
		let question = "";
		let correct_answer = "";
		let incorrect_answers = []
		// Get Trivia question
		if (Math.random() < 0.5) {
			const res = await axios.get('https://the-trivia-api.com/api/questions?limit=11', {
				headers: {
					'Test-Header': 'test-value'
				}
			});
				
			const info = (res.data[0]);
		
			category = (info.category);
			correct_answer = (info.correctAnswer);
			incorrect_answers = (info.incorrectAnswers.slice(0,3));
			question = (info.question);
			difficulty = ("N/A");
		}
	
		else {
			const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', {
				headers: {
					'Test-Header': 'test-value'
				}
				});
				
			const info = (res.data.results[0]);
	
			category = decode(info.category);
			difficulty = decode(info.difficulty);
			question = decode(info.question);
			correct_answer = decode(info.correct_answer);

			for (let i = 0; i < info.incorrect_answers.length; i++)
				incorrect_answers.push(decode(info.incorrect_answers[i]));
		}

		// Shuffle the correct answer into the correct answer.
		incorrect_answers.push(correct_answer);
		shuffle(incorrect_answers);

		// Mark what the correct answer is in the list.
		for (var i = 0; i < incorrect_answers.length; i++) {
			if (correct_answer === incorrect_answers[i]){
				corAnsNum = i
			}
		}
		
		// Embed 
		const triviaEmbed = new EmbedBuilder()
			.setThumbnail('https://i.imgur.com/cuhu5P2.png')
			.setColor(0xFF6F00)
			.setTitle(category)
			.setDescription(question)
			.setFooter({ text: `Difficulty: ${difficulty}`, iconURL: 'https://i.imgur.com/nuEpvJd.png'});

		
		// Buttons
		var buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('A')
					.setLabel(incorrect_answers[0])
					.setStyle(ButtonStyle.Primary),

				new ButtonBuilder()
					.setCustomId('B')
					.setLabel(incorrect_answers[1])
					.setStyle(ButtonStyle.Primary),

				new ButtonBuilder()
					.setCustomId('C')
					.setLabel(incorrect_answers[2])
					.setStyle(ButtonStyle.Primary),

				new ButtonBuilder()
					.setCustomId('D')
					.setLabel(incorrect_answers[3])
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({  
				embeds: [triviaEmbed], 
				components: [buttons]
			}) 
		
		const collector = interaction.channel.createMessageComponentCollector({ time: 15000 }); //time: 15 seconds

		var correctEntries = [];
		var incorrectEntries = [];

		var buttonStyleA = ButtonStyle.Primary
		var buttonStyleB = ButtonStyle.Primary
		var buttonStyleC = ButtonStyle.Primary
		var buttonStyleD = ButtonStyle.Primary

		collector.on('collect', async i => {

			user = (`<@${i.user.id}>`);
			buttonClicked = (i.customId);
			console.log(`Trivia Button Clicked:\n   User: ${user}\n   ButtonClicked: ${buttonClicked}`);

			if (buttonClicked === "A" ) {
				arraySequence(corAnsNum, 0, user, correctEntries, incorrectEntries);
			}

			else if (buttonClicked === "B" ) {
				arraySequence(corAnsNum, 1, user, correctEntries, incorrectEntries);
			}

			else if (buttonClicked === "C" ) {
				arraySequence(corAnsNum, 2, user, correctEntries, incorrectEntries);
			}

			else if (buttonClicked === "D" ) {
				arraySequence(corAnsNum, 3, user, correctEntries, incorrectEntries);
			}
		
			await i.deferUpdate();
		});

		collector.on('end', async i => {

			console.log("Ended Trivia Message");

			if (corAnsNum === 0){
				buttonStyleA = ButtonStyle.Success
			}

			else if (corAnsNum === 1){
				buttonStyleB = ButtonStyle.Success
			}

			else if (corAnsNum === 2){
				buttonStyleC = ButtonStyle.Success
			}

			else if (corAnsNum === 3){
				buttonStyleD = ButtonStyle.Success
			};


			var buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('A')
					.setLabel(incorrect_answers[0])
					.setStyle(buttonStyleA)
					.setDisabled(true),
	
				new ButtonBuilder()
					.setCustomId('B')
					.setLabel(incorrect_answers[1])
					.setStyle(buttonStyleB)
					.setDisabled(true),
	
				new ButtonBuilder()
					.setCustomId('C')
					.setLabel(incorrect_answers[2])
					.setStyle(buttonStyleC)
					.setDisabled(true),
	
				new ButtonBuilder()
					.setCustomId('D')
					.setLabel(incorrect_answers[3])
					.setStyle(buttonStyleD)
					.setDisabled(true),
			);
	
			await interaction.editReply({
				components: [buttons],
			});
		
			interaction.channel.send(
				{  content: `The correct answer is: ${correct_answer}\nCongratulations to: ${correctEntries}\nBetter luck next time: ${incorrectEntries}`,
			});			
		});

	}
};

function shuffle(array) {
	let currentIndex = array.length,  randomIndex;
  
	// While there remain elements to shuffle...
	while (currentIndex != 0) {
  
	  // Pick a remaining element...
	  randomIndex = Math.floor(Math.random() * currentIndex);
	  currentIndex--;
  
	  // And swap it with the current element.
	  [array[currentIndex], array[randomIndex]] = [
		array[randomIndex], array[currentIndex]];
	}
  
	return array;
}


function arraySequence(corAnsNum, buttonValue, user, correctEntries, incorrectEntries) {
	if (corAnsNum === buttonValue){

		if (correctEntries.indexOf(user) > -1) {
			correctEntries.splice(correctEntries.indexOf(user), 1);
		}
		if (incorrectEntries.indexOf(user) > -1) {
			incorrectEntries.splice(incorrectEntries.indexOf(user), 1);
		}

		correctEntries.push(user);
	}
	else {

		if (correctEntries.indexOf(user) > -1) {
			correctEntries.splice(correctEntries.indexOf(user), 1);
		}
		if (incorrectEntries.indexOf(user) > -1) {
			incorrectEntries.splice(incorrectEntries.indexOf(user), 1);
		}

		incorrectEntries.push(user);
	}
}