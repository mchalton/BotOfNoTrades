const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs')
const axios = require('axios');
const admin = require('../shared/admin.js');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
    data: new SlashCommandBuilder()
		.setName('restartserver')
		.setDescription('Restart the server'),


	async execute(interaction) {

		const isAdmin = admin.isAdmin(interaction.user.id);        
        if (!isAdmin) {
			await admin.showPermissionDenied(interaction);
			return;
		}
        
        console.log("Running /restartserver");
    
        await interaction.deferReply();

        try {
        
            const username = secretinfo.server.username;
            const password = secretinfo.server.password;
            const url = 'https://dathost.net/api/0.1/game-servers';
            const auth_header = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

            const server_id = '651693489e3eacfd1fdb8698';

            const server_url = url + `/${server_id}/start`;
            const formData = new FormData();
            //formData.append('line', `host_workshop_map ${map_id}`);

            const restart_response = await axios.post(server_url, formData, {
                headers:  {
                    'Content-Type': 'multipart/form-data',
                    'authorization': auth_header
                }
            });

            if (restart_response.status != 200) {
                await interaction.editReply('Restart failed (1)');
                return;
            }
            await interaction.editReply("Server restarted successfully!");
        }
        catch (error) {
            console.log(error);
            await interaction.editReply('Restart failed (2)');
            return;
        }
        console.log('Completed /restartserver');   
	},
};

