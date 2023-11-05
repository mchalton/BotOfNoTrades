const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const axios = require('axios');
const fs = require('fs');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wingman')
		.setDescription('Executes wingman config and starts a game'),


	async execute(interaction) {

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}

        if (adminCheck) {
            console.log('Commencing /wingman');

            
            try {
            
                const username = secretinfo.server.username;
                const password = secretinfo.server.password;
                const url = 'https://dathost.net/api/0.1/game-servers';
                const auth_header = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
                const server_id = '651693489e3eacfd1fdb8698';

                const server_url = url + `/${server_id}/console`;

                const formData1 = new FormData();
                formData1.append('line', 'exec gamemode_competitive2v2');

                const gamemode_response = await axios.post(server_url, formData1, {
                    headers:  {
                        'Content-Type': 'multipart/form-data',
                        'authorization': auth_header
                    }
                });

                if (gamemode_response.status != 200) {
                    await interaction.editReply('Failed to change gamemode (1)');
                    return;
                }

                
                const formData2 = new FormData();
                formData2.append('line', 'mp_warmup_end');

                const start_response = await axios.post(server_url, formData2, {
                    headers:  {
                        'Content-Type': 'multipart/form-data',
                        'authorization': auth_header
                    }
                });

                if (start_response.status != 200) {
                    await interaction.editReply('Failed to end warmup (2)');
                    return;
                }

            }
            catch (error) {
                console.log(error);
                await interaction.editReply('Failed to run /wingman (3)');
                return;
            }

            // Send Embed 
            var startEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Started Wingman Game');
            await interaction.reply({ embeds: [startEmbed]})

            console.log('Completed /wingman');
        } 
        else {
            // Missing Perms 
            var deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},
};

