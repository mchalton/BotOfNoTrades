const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

//  First half of Snippet of code to defer commands to ./commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
console.log(commandFiles);
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}


client.on('interactionCreate', async interaction => {

	if (!interaction.isCommand()) return;	// Checks if the interaction is a command. Returns true on eg: 'schedule'.
	
	const command = client.commands.get(interaction.commandName);

	if (!command) return; // When command does not exist.

	await command.execute(interaction);
});



//On Discord Api Error 
process.on('unhandledRejection', (reason, promise) => {
	console.log('Unhandled Rejection at:', promise, 'reason:', reason);
	fs.appendFile('log.txt', ('\n'.concat('Unhandled Rejection at:' + promise + '\nreason:' + reason)), function (err) {
		if (err) return console.log(err);
	});
});

client.login(token);