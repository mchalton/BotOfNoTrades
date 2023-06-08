const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
var Rcon = require('rcon');
const fs = require('fs')
const request = require('request');

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
	},
};

