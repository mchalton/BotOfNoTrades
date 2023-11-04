const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs')
const axios = require('axios');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prac')
		.setDescription('Set server to practice mode'),


	async execute(interaction) {
        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}
        
        if (adminCheck) {
            console.log("Commencing /prac");
        
		    await interaction.deferReply();

            try {
            
                const username = secretinfo.server.username;
                const password = secretinfo.server.password;
                const url = 'https://dathost.net/api/0.1/game-servers';
                const auth_header = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
                const list_response = await axios.get(url, {
                    headers: {
                        'authorization': auth_header
                    }
                });
                let server_id = '';
                const serverList = list_response.data;
                for (const serverIndex in serverList) {
                    const server = serverList[serverIndex];
                    if (server.name === 'Jack Of No Trades') {
                        server_id = server.id;
                        break;
                    }
                }

                if (server_id.length == 0) {
                    await interaction.editReply('Failed to find server');
                    return;
                }

                const server_url = url + `/${server_id}/console`;

                const formData = new FormData();
                formData.append('line', 'exec prac');

                const map_response = await axios.post(server_url, formData, {
                    headers:  {
                        'Content-Type': 'multipart/form-data',
                        'authorization': auth_header
                    }
                });

                if (map_response.status != 200) {
                    await interaction.editReply('prac failed (1)');
                    return;
                }

            }
            catch (error) {
                console.log(error);
                await interaction.editReply('prac failed (2)');
                return;
            }
            await interaction.editReply("Server set to Practice mode");
            console.log('Completed /prac');
        
        } else {
            // Missing Perms 
            var deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},
};

