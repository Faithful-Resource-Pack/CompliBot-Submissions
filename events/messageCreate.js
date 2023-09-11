const client = require("@index").Client;

const { MessageEmbed } = require("discord.js");

const MAINTENANCE = process.env.MAINTENANCE.toLowerCase() == "true";
const PREFIX = process.env.PREFIX;

const strings = require("@resources/strings.json");
const settings = require("@resources/settings.json");

const submitTexture = require("@submission/submitTexture");

const addDeleteButton = require("@helpers/addDeleteButton");
const warnUser = require("@helpers/warnUser");
const invalidSubmission = require("@functions/submission/utility/invalidSubmission");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "messageCreate",
	/** @param {import("discord.js").Message} message */
	async execute(message) {
		// Ignore bot messages
		if (message.author.bot) return;

		/**
		 * LEGACY PREFIX COMMAND HANDLER
		 */
		if (message.content.startsWith(PREFIX)) {
			if (MAINTENANCE && !process.env.DEVELOPERS.includes(message.author.id)) {
				const msg = await message.reply({ content: strings.command.maintenance });
				await message.react(settings.emojis.downvote);
				if (message.deletable) setTimeout(() => msg.delete(), 30000);
			}

			const args = message.content.toLowerCase().slice(PREFIX.length).trim().split(/ +/);
			const commandName = args.shift().toLowerCase();
			/** @type {import("@helpers/jsdoc").Command} */
			const command =
				client.commands.get(commandName) ||
				client.commands.find((cmd) => cmd.aliases?.includes(commandName));

			if (!command) return; // stops a dev error being thrown every single time a message starts with a slash
			if (command.guildOnly && message.channel.type === "DM")
				return warnUser(message, strings.bot.cant_dm);

			try {
				await command.execute(client, message, args);
			} catch (error) {
				console.trace(error);

				const embed = new MessageEmbed()
					.setColor(settings.colors.red)
					.setTitle(strings.bot.error)
					.setThumbnail(settings.images.error)
					.setDescription(
						`${strings.command.error}\nError for the developers:\n\`\`\`${error}\`\`\``,
					);

				let msgEmbed = await message.reply({ embeds: [embed] });
				await message.react(settings.emojis.downvote);
				return await addDeleteButton(msgEmbed);
			}
		} else {
			/**
			 * TEXTURE SUBMISSION
			 */
			const submissionChannels = Object.values(settings.submission.packs).map(
				(pack) => pack.channels.submit,
			);
			if (submissionChannels.includes(message.channel.id)) return submitTexture(client, message);

			/**
			 * BASIC AUTOREACT
			 */
			if (settings.submission.autoreact.includes(message.channel.id)) {
				if (!message.attachments.size)
					return await invalidSubmission(message, strings.submission.image_not_attached);

				await message.react(settings.emojis.upvote);
				await message.react(settings.emojis.downvote);
			}
		}
	},
};
