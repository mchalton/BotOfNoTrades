const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
var Rcon = require('rcon');
const fs = require('fs')

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

// Sleep Function
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rcon')
		.setDescription('Send a command to the Server')
        .addStringOption(option => option.setName('command').setDescription('Enter a Rcon Command').setRequired(true)),


	async execute(interaction) {

        command = interaction.options.getString('command');

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}
        
        if (adminCheck) {
            console.log("Commencing /rcon " + command);
            await interaction.deferReply();

            let content = '';
            const conn = new Rcon((secretinfo.server.serverIP), 27015, (secretinfo.server.serverPassword));
           
            conn.on('auth', function() {
                    conn.send(command);
                    conn.disconnect();
                    
                }).on('response', async function(str) {
                    content = content.concat(str);
                    console.log("Response: " + content);

                }).on('error', function(err) {
                    console.log("Error: " + err);

                }).on('end', async function() {
                    console.log("Ended Rcon");
            });
            conn.connect();

            async function sendDelayMsg() {
                await sleep(3000);
                
                try {
                    // Embed 
                    var rconEmbed = new EmbedBuilder()
                        .setColor(0xFF6F00)
                        .setTitle('Successfully sent command: ' + command)
                        .setDescription(`\u200b${content}`);
    
                    await interaction.editReply({ embeds: [rconEmbed]});
                    
                } catch (error) {console.log(error);}
            }
            
            await sendDelayMsg();
            console.log("Completed /rcon");
        
        } else {
            // Missing Perms 
            var deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},
};

