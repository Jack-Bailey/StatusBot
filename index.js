const Discord = require("discord.js");
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { data } = require("./commands/ping");
require("dotenv").config();

client = new Discord.Client({ intents: ["GUILD_MESSAGES"] });

const commands = [];
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

function allPlatforms() {
	var data = require("./data.json");
	var embeds = [];
	Object.keys(data.status.statuses).forEach(async function (platform, index) {
		embeds.push(getPlatform(platform));
	});
	return embeds;
}

async function updateStatus() {
	var data = require("./data.json");
	var statusChannel = await client.channels.fetch(data.status.channel);
	var messageExists = false;
	if (data.status.message !== "") {
		try {
			var message = await statusChannel.messages.fetch(data.status.message);
			messageExists = true;
		} catch (error) {
			console.log("Message doesn't exist " + error);
		}
	}
	if (!messageExists) {
		var loading = new Discord.MessageEmbed().setColor("#000000").setTitle("Loading...");
		var message = await statusChannel.send({ embeds: [loading] });
		data.status.message = message.id.toString();
		fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), function (err) {
			if (err) {
				console.log(err);
			}
		});
	}
	if (data.status.renameOnStatus) {
		var issues = 0;
		var down = 0;
		Object.keys(data.status.statuses).forEach(async function (platform, index) {
			if (data.status.statuses[platform].statusType === "limited") {
				issues++;
			}
			if (data.status.statuses[platform].statusType === "offline") {
				down++;
			}
		});
		var name = null;
		if (down > 0 && down < data.status.statuses.length) {
			name = "some offline";
		} else if (down == data.status.statuses.length) {
			name = "all offline";
		} else if (issues > 0) {
			name = "some issues";
		} else if (issues == data.status.statuses.length) {
			name = "all issues";
		}
		if (name) {
			await statusChannel
				.setTopic(name)
				.then((updated) => console.log(updated))
				.catch(console.error);
		} else {
			await statusChannel.setTopic(data.status.defaultName);
		}
	}

	await message.edit({ embeds: allPlatforms() });
}

function getPlatform(platform) {
	var data = require("./data.json");
	if (data.status.statuses.hasOwnProperty(platform)) {
		var status = data.status.statuses[platform];
		var embed = new Discord.MessageEmbed()
			.setColor(status.statusType == "online" ? "3AA55D" : status.statusType == "limited" ? "FAA81A" : "ED4145")
			.setTitle(status.name)
			.setDescription(
				status.customStatus
					? status.customStatus
					: {
							online: "Online - Service is up & operational ",
							limited: "Limited Functionality - Some aspects of this service are temporarily unavailable",
							offline: "Offline - Service is down & Not operational",
					  }[status.statusType]
			);
		return embed;
	}
	return null;
}

client.on("ready", async function () {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity("ROBLOX", { type: "PLAYING" });
	await updateStatus();
});

client.on("interactionCreate", async (interaction) => {
	var data = require("./data.json");
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === "ping") {
		await interaction.reply({ content: "Pong!", ephemeral: true });
	} else if (commandName === "status") {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand == "get") {
			var platform = interaction.options.getString("platform");
			if (!platform) return interaction.reply({ embeds: allPlatforms(), ephemeral: true });

			return interaction.reply({ embeds: [getPlatform(platform)] });
		}

		if (subcommand == "set" || subcommand == "reset") {
			var member = await interaction.guild.members.cache.find((member) => member.id === interaction.member.id);
			var hasRole =
				data.adminRoles.filter((role) => {
					return member._roles.includes(role);
				}).length > 0;

			if (!hasRole) return interaction.reply({ content: "Insufficient permissions", ephemeral: true });

			if (subcommand == "reset") {
				var platform = interaction.options.getString("platform");
				if (!platform) {
					Object.keys(data.status.statuses).forEach(function (platform) {
						data.status.statuses[platform] = {
							customStatus: null,
							statusType: "online",
							name: data.status.statuses[platform].name,
						};
					});
					fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), function (err) {
						if (err) {
							console.log(err);
						}
					});
					await updateStatus();
					fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), function (err) {
						if (err) {
							console.log(err);
						}
					});
					return interaction.reply({ content: "Reset all platforms", ephemeral: true });
				}
				data.status.statuses[platform] = {
					customStatus: null,
					statusType: "online",
					name: data.status.statuses[platform].name,
				};
				fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), function (err) {
					if (err) {
						console.log(err);
					}
				});
				return interaction.reply({ content: "Reset platform", ephemeral: true });
			}
			if (subcommand == "set") {
				var platform = interaction.options.getString("platform");
				if (!platform) return interaction.reply({ content: "Please specify a platform", ephemeral: true });
				var statusType = interaction.options.getString("status-type");
				if (!statusType) return interaction.reply({ content: "Please specify a status type", ephemeral: true });
				var customStatus = interaction.options.getString("custom-status");
				data.status.statuses[platform] = {
					customStatus: customStatus ? customStatus : null,
					statusType,
					name: data.status.statuses[platform].name,
				};
				fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), function (err) {
					if (err) {
						console.log(err);
					}
				});
				await updateStatus();
				return interaction.reply({ content: "Updated platform", ephemeral: true });
			}
		}
		await interaction.reply("ok");
	} else if (commandName === "source") {
		await interaction.reply("https://jck.cx/g/StatusBot");
	}
});

client.login(process.env.TOKEN);
