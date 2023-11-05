const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs')
const axios = require('axios');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

module.exports = {
    data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Change the map on the server')
        .addStringOption(option => option.setName('id').setDescription('Map ID').setRequired(true)),


	async execute(interaction) {

        const map_id = interaction.options.getString('id');

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}
        
        if (adminCheck) {
            console.log("Running /map " + map_id);
        
		    await interaction.deferReply();

            try {
            
                const username = secretinfo.server.username;
                const password = secretinfo.server.password;
                const url = 'https://dathost.net/api/0.1/game-servers';
                const auth_header = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

                const server_id = '651693489e3eacfd1fdb8698';

                /*
                let server_id = '';
                const list_response = await axios.get(url, {
                    headers: {
                        'authorization': auth_header
                    }
                });
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
                }*/

                /*
                // cleanup old maps
                const filelist_url = url + `/${server_id}/files?hide_default_files=false&include_deleted_files=false&path=maps%2Fworkshop&with_filesizes=true`;
                const filelist_response = await axios.get(filelist_url, {
                    headers:  {
                        'authorization': auth_header
                    }
                });

                if (filelist_response.status == 200) {
                    
                    const data = filelist_response.data;
                    data.forEach(async (item) => {
                        if (item.size == 4096 && item.path != (map_id + '/')) { // is folder
                            console.log(`Deleting ${item.path}`);
                            const delete_url = url + `/${server_id}/files/maps%2Fworkshop/${item.path}`;
                            const del_response = await axios.delete(delete_url, {
                                headers:  {
                                    'authorization': auth_header
                                }
                            });
                            if (del_response.status != 200) {
                                console.log('Failed to clear workshop cache');
                            }
                        }
                    });
                }*/

                const server_url = url + `/${server_id}/console`;
                const formData = new FormData();
                formData.append('line', `host_workshop_map ${map_id}`);

                const map_response = await axios.post(server_url, formData, {
                    headers:  {
                        'Content-Type': 'multipart/form-data',
                        'authorization': auth_header
                    }
                });

                if (map_response.status != 200) {
                    await interaction.editReply('Map change failed (1)');
                    return;
                }

                /*setTimeout(async () => {                
                    const formData2 = new FormData();
                    formData2.append('line', `exec prac`);

                    
                    await axios.post(server_url, formData2, {
                        headers:  {
                            'Content-Type': 'multipart/form-data',
                            'authorization': auth_header
                        }
                    });
                }, 10000);*/
                
                const workshop_url = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";
                const workshop_data = new FormData();
                workshop_data.append('itemcount', '1');
                workshop_data.append('publishedfileids[0]', `${map_id}`);
                
                const workshop_response = await axios.post(workshop_url, workshop_data);
                
                try {
                    let mapDetails = JSON.parse(JSON.stringify(workshop_response.data));

                    let mapURL = (`https://steamcommunity.com/sharedfiles/filedetails/?id=${map_id}`);
                    let mapName = (mapDetails.response.publishedfiledetails[0].title);
                    let mapImage = (mapDetails.response.publishedfiledetails[0].preview_url);

                    var mapEmbed = new EmbedBuilder()
                        .setColor(0xFF6F00)
                        .setTitle(`Successfully Changed Map to: ${mapName}`)
                        .setURL(mapURL)
                        .setImage(mapImage)
                        .setFooter({ text: `Workshop ID: ${map_id}` });
                    
                    await interaction.editReply({ embeds: [mapEmbed],})

                } catch (error) {
                    console.log("request():\n" + error);
                    await interaction.editReply("Map changed to '" + map_id + "'");
                }

            }
            catch (error) {
                console.log(error);
                await interaction.editReply('Map change failed (2)');
                return;
            }
            console.log('Completed /map');        
        } else {
            // Missing Perms 
            const deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},
};

