const { SlashCommandBuilder } = require("@discordjs/builders");
module.exports = {
	data: new SlashCommandBuilder()
		.setName("status")
		.setDescription("status management")
		.addSubcommand((subcommand) => {
			return subcommand
				.setName("get")
				.setDescription("get a status")
				.addStringOption((option) => {
					return option
						.setName("platform")
						.setDescription("platform to get status for")
						.setRequired(false)
						.addChoice("windows", "win")
						.addChoice("mac", "mac")
						.addChoice("ios", "ios")
						.addChoice("website", "web");
				});
		})
		.addSubcommand((subcommand) => {
			return subcommand
				.setName("reset")
				.setDescription("reset status(es)")
				.addStringOption((option) => {
					return option
						.setName("platform")
						.setDescription("platform to reset status for")
						.setRequired(false)
						.addChoice("windows", "win")
						.addChoice("mac", "mac")
						.addChoice("ios", "ios")
						.addChoice("website", "web");
				});
		})
		.addSubcommand((subcommand) => {
			return subcommand
				.setName("set")
				.setDescription("set a status")
				.addStringOption((option) => {
					return option
						.setName("platform")
						.setDescription("platform to get status for")
						.setRequired(true)
						.addChoice("windows", "win")
						.addChoice("mac", "mac")
						.addChoice("ios", "ios")
						.addChoice("website", "web");
				})
				.addStringOption((option) => {
					return option
						.setName("status-type")
						.setDescription("type of status uptime")
						.setRequired(true)
						.addChoice("online", "online")
						.addChoice("limited", "limited")
						.addChoice("offline", "offline");
				})
				.addStringOption((option) => {
					return option.setName("custom-status").setDescription("message to display").setRequired(false);
				});
		}),
};
