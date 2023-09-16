const settings = require("@resources/settings.json");
const { startBot } = require("@index");
const fetchSettings = require("@functions/fetchSettings");

const { EmbedBuilder } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	name: "restart",
	guildOnly: false,
	async execute(client, message, args) {
		if (!process.env.DEVELOPERS.includes(message.author.id))
			await message.react(settings.emojis.downvote);

		await message.reply({
			embeds: [new EmbedBuilder().setTitle("Restarting...").setColor(settings.colors.blue)],
		});

		client.destroy();

		fetchSettings()
			.then(() => startBot())
			.catch(() =>
				message.channel.send({
					embeds: [
						new EmbedBuilder()
							.setTitle("Something went wrong when restarting the bot!")
							.setDescription("This error is likely related to fetching `settings.json`")
							.setColor(settings.colors.red)
							.setThumbnail(settings.images.error),
					],
				}),
			);
	},
};
