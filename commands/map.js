const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
//var Rcon = require('rcon');
const fs = require('fs')
const request = require('request');
const axios = require('axios');

let secretinfo = JSON.parse(fs.readFileSync('commands/database/secretinfo.json'));

let wid = {
    set current(name) {
      this.log = (name);
    },
    log: String
  }

module.exports = {
    data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Change map on the server')
        .addStringOption(option => option.setName('name').setDescription('Enter the name of the map').setRequired(true)),


	async execute(interaction) {

        const mapname = interaction.options.getString('name');

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}
        
        if (adminCheck) {
            console.log("Running /map " + mapname);
        
		    await interaction.deferReply();

            try {
            
                const username = secretinfo.server.username;
                const password = secretinfo.server.password;
                const url = 'https://dathost.net/api/0.1/game-servers';
                const auth_header = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
                const list_response = await axios.get(url, {
                    headers: {
                    //	'accept': 'application/json',
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
                formData.append('line', `rcon map ${mapname}`);
                //console.log(formData.getHeaders());

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

            }
            catch (error) {
                console.log(error);
                await interaction.editReply('Map change failed (2)');
                return;
            }
            await interaction.editReply("Map changed to '" + mapname + "'");
            console.log('Completed /map');

            /*const conn = new Rcon((secretinfo.server.serverIP), 27015, (secretinfo.server.serverPassword));

            conn.once('auth', function() {
                conn.send(('host_workshop_map ').concat(workshopid));
                conn.disconnect();

                }).on('error', function(err) {
                    console.log("Error: " + err);

                }).on('end', function() {
                    console.log("Ended map");    
            });
            conn.connect();

            try {
                var options = {
                    'method': 'POST',
                    'url': 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                    'headers': {
                    },
                    formData: {
                    'itemcount': '1',
                    'publishedfileids[0]': `${workshopid}`
                    }
                };
                
                request(options, async function (error, response) {
                    if (error) throw new Error(error);
                    try {
                        let mapDetails = JSON.parse(response.body);

                        let mapURL = (`https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopid}`);
                        let mapName = (mapDetails.response.publishedfiledetails[0].title);
                        let mapImage = (mapDetails.response.publishedfiledetails[0].preview_url);

                        var mapEmbed = new EmbedBuilder()
                            .setColor(0xFF6F00)
                            .setTitle(`Successfully Changed Map to: ${mapName}`)
                            .setURL(mapURL)
                            .setImage(mapImage)
                            .setFooter({ text: `Workshop ID: ${workshopid}` });
                        
                        await interaction.reply({ embeds: [mapEmbed],})

                    } catch (error) {console.log("request():\n" + error);}
                });

            } catch (error) {
                console.log(error);
                var mapEmbed = new EmbedBuilder()
                    .setColor(0xFF6F00)
                    .setTitle('Successfully Changed Map to: ' + workshopid)
                    .setURL('https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(workshopid));

                await interaction.reply({ embeds: [mapEmbed],})
            }

            console.log('Completed /map');*/
        
        } else {
            // Missing Perms 
            const deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},
	/*data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Change map on the server')
        .addStringOption(option => option.setName('workshopid').setDescription('Enter a Workshop ID').setRequired(true)),


	async execute(interaction) {

        const workshopid = interaction.options.getString('workshopid');

        // Checking if user is an admin
		let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (interaction.user.id)) adminCheck = true;
		}
        
        if (adminCheck) {
            console.log("Commencing /map " + workshopid);

            const conn = new Rcon((secretinfo.server.serverIP), 27015, (secretinfo.server.serverPassword));

            conn.once('auth', function() {
                conn.send(('host_workshop_map ').concat(workshopid));
                conn.disconnect();

                }).on('error', function(err) {
                    console.log("Error: " + err);

                }).on('end', function() {
                    console.log("Ended map");    
            });
            conn.connect();

            try {
                var options = {
                    'method': 'POST',
                    'url': 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                    'headers': {
                    },
                    formData: {
                    'itemcount': '1',
                    'publishedfileids[0]': `${workshopid}`
                    }
                };
                
                request(options, async function (error, response) {
                    if (error) throw new Error(error);
                    try {
                        let mapDetails = JSON.parse(response.body);

                        let mapURL = (`https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopid}`);
                        let mapName = (mapDetails.response.publishedfiledetails[0].title);
                        let mapImage = (mapDetails.response.publishedfiledetails[0].preview_url);

                        var mapEmbed = new EmbedBuilder()
                            .setColor(0xFF6F00)
                            .setTitle(`Successfully Changed Map to: ${mapName}`)
                            .setURL(mapURL)
                            .setImage(mapImage)
                            .setFooter({ text: `Workshop ID: ${workshopid}` });
                        
                        await interaction.reply({ embeds: [mapEmbed],})

                    } catch (error) {console.log("request():\n" + error);}
                });

            } catch (error) {
                console.log(error);
                var mapEmbed = new EmbedBuilder()
                    .setColor(0xFF6F00)
                    .setTitle('Successfully Changed Map to: ' + workshopid)
                    .setURL('https://steamcommunity.com/sharedfiles/filedetails/?id='.concat(workshopid));

                await interaction.reply({ embeds: [mapEmbed],})
            }

            console.log('Completed /map');
        
        } else {
            // Missing Perms 
            const deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
            await interaction.reply({embeds: [deniedEmbed], ephemeral: true });
        }
	},*/
};

