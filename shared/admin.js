const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    isAdmin: (user_id) => {
        let adminJson = JSON.parse(fs.readFileSync('./commands/database/admin.json'));
		let adminCheck = false;
		for (let i = 0; i < adminJson.admins.length; i++) {
			if ((adminJson.admins[i].userid) == (user_id)) {
				adminCheck = true;
			}
		}
        return adminCheck;
    },
    showPermissionDenied: async (interaction) => {
        var deniedEmbed = new EmbedBuilder().setColor(0xFF6F00).setTitle('Permission Denied').setDescription('Must be an Admin');
        await interaction.reply({ embeds: [deniedEmbed], ephemeral: true })
    }
}