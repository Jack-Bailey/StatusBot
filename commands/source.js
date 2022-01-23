const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder().setName("source").setDescription("Get this bot's source"),
	async execute(interaction) {
		await interaction.reply("https://github.com/Jack-Bailey/StatusBot");
	},
};
