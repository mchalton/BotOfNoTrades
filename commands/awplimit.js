const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var Rcon = require('rcon');
const fs = require('fs');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('awplimit')
		.setDescription('Set Awp Limit on the Server')
        .addStringOption(option => option.setName('number').setDescription('Number of Awps').setRequired(true)),


	async execute(interaction) {

        number = interaction.options.getString('number');

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}

        if (adminCheck) {
            console.log('Commencing /awplimit');

            const conn = new Rcon((secretinfo.server.serverIP), 27015, (secretinfo.server.serverPassword));

            conn.once('auth', function() {
                conn.send(`sm_restrict awp ${number} t `);
                conn.send(`sm_restrict awp ${number} ct `);
                conn.disconnect();

                }).on('error', function(err) {
                    console.log("Error: " + err);

                }).on('end', function() {
                    console.log("Connection closed"); 
            });
            conn.connect();
              
            // Send Embed 
            var startEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle(`Set Awp Limit to: ${number}`);
            await interaction.reply({ embeds: [startEmbed]});
            console.log('Completed /awplimit');
        } 
        else {
            // Missing Perms 
            var deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},
};

