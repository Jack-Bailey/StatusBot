const Discord = require("discord.js");
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { data } = require("./commands/ping");
require("dotenv").config();

client = new Discord.Client({ partials: ["CHANNEL"], intents: ["GUILD_MESSAGES", "DIRECT_MESSAGES"] });

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
	var counts = {
		online: 0,
		limited: 0,
		offline: 0,
	};

	Object.keys(data.status.statuses).forEach(async function (platform, index) {
		counts[data.status.statuses[platform].statusType]++;
	});

	var status = "online";
	var title = "";
	if (counts.offline > 0) {
		if (counts.offline == Object.keys(data.status.statuses).length) {
			title = "All services are offline";
		} else {
			title = `${counts.offline}/${Object.keys(data.status.statuses).length} services are offline`;
		}
		status = "dnd";
	} else if (counts.limited > 0) {
		if (counts.limited == Object.keys(data.status.statuses).length) {
			title = "All services are limited";
		} else {
			title = `${counts.limited}/${Object.keys(data.status.statuses).length} services are limited`;
		}
		status = "idle";
	} else {
		title = "All services are online";
	}
	await client.user.setPresence({
		status: status,
		activities: [
			{
				name: title,
				type: "WATCHING",
			},
		],
	});
	await message.edit({ embeds: allPlatforms() });
}

async function update(data) {
	fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), function (err) {
		if (err) {
			console.log(err);
		}
	});
	await updateStatus();
}

async function log(data, user) {
	console.log(user);
	var avatar = user.avatar
		? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=32`
		: "https://discord.com/assets/3c6ccb83716d1e4fb91d3082f6b21d77.png";
	var embed = new Discord.MessageEmbed()
		.setColor(data.new.statusType == "online" ? "3AA55D" : data.new.statusType == "limited" ? "FAA81A" : "ED4145")
		.setTitle(data.title)
		.setDescription(data.description)
		.setAuthor(`${user.username}#${user.discriminator}`, avatar);

	var data = require("./data.json");
	var logChannel = await client.channels.fetch(data.status.logs);
	await logChannel.send({ embeds: [embed] });
}

function getPlatform(platform) {
	var data = require("./data.json");
	if (data.status.statuses.hasOwnProperty(platform)) {
		var status = data.status.statuses[platform];
		var embed = new Discord.MessageEmbed()
			.setColor(data.colors[status.statusType])
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
	await updateStatus();
});

client.on("messageCreate", async function (msg) {
	if (msg.guild == null && !msg.author.bot) {
		var reply = {
			online: [],
			limited: [],
			offline: [],
		};
		var data = require("./data.json");
		var platforms = Object.keys(data.status.statuses);
		platforms.forEach(function (platform, index) {
			switch (data.status.statuses[platform].statusType) {
				case "online":
					reply.online.push(data.status.statuses[platform].name);
					break;
				case "limited":
					reply.limited.push(data.status.statuses[platform].name);
					break;
				case "offline":
					reply.offline.push(data.status.statuses[platform].name);
					break;
			}
		});
		var embeds = [];
		if (reply.online.length > 0) {
			var embed = new Discord.MessageEmbed().setColor(data.colors.online).setTitle("Online").setDescription(reply.online.join("\n "));
			embeds.push(embed);
		}
		if (reply.limited.length > 0) {
			var embed = new Discord.MessageEmbed().setColor(data.colors.limited).setTitle("Limited").setDescription(reply.limited.join("\n "));
			embeds.push(embed);
		}
		if (reply.offline.length > 0) {
			var embed = new Discord.MessageEmbed().setColor(data.colors.offline).setTitle("Offline").setDescription(reply.offline.join("\n "));
			embeds.push(embed);
		}
		await msg.reply({ content: "Current statuses:", embeds });
	}
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

			if (!hasRole) return interaction.reply({ content: "Only moderators and above can use this command", ephemeral: true });

			if (subcommand == "reset") {
				var platform = interaction.options.getString("platform");
				console.log(platform);
				if (!platform) {
					Object.keys(data.status.statuses).forEach(function (platform) {
						data.status.statuses[platform] = {
							customStatus: null,
							statusType: "online",
							name: data.status.statuses[platform].name,
						};
					});
					await update(data);
					await log(
						{
							title: "Reset all statuses",
							description: "All statuses have been reset to online",
							new: { statusType: "online" },
						},
						member.user
					);
					return interaction.reply({ content: "Reset all platforms", ephemeral: true });
				}
				data.status.statuses[platform] = {
					customStatus: null,
					statusType: "online",
					name: data.status.statuses[platform].name,
				};
				await log(
					{
						title: "Reset status",
						description: `Status for ${platform} has been reset to online`,
						new: { statusType: "online" },
					},
					member.user
				);

				await update(data);
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
				await log(
					{
						title: "Set status",
						description: `Status for ${platform} has been set to ${statusType}`,
						new: { statusType },
					},
					member.user
				);

				await update(data);
				return interaction.reply({ content: "Updated platform", ephemeral: true });
			}
		}
	} else if (commandName === "source") {
		await interaction.reply("https://jck.cx/g/StatusBot");
	}
});

client.login(process.env.TOKEN);
