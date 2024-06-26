const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const addDeleteButton = require("@helpers/addDeleteButton");
const { EmbedBuilder } = require("discord.js");
const handleError = require("@functions/handleError");

/**
 * "fake" emitted event to split up interactionCreate
 * @type {import("@helpers/jsdoc").Event}
 */
module.exports = {
	name: "slashCommandUsed",
	/** @param {import("discord.js").ChatInputCommandInteraction} interaction */
	async execute(interaction) {
		if (!client.commands.has(interaction.commandName)) return;
		/** @type {import("@helpers/jsdoc").Command} */
		const command = await interaction.client.commands.get(interaction.commandName);

		// ! await required for try catch support
		try {
			await command.execute(interaction);
		} catch (error) {
			handleError(interaction.client, error, "Slash Command Error");

			const embed = new EmbedBuilder()
				.setColor(settings.colors.red)
				.setTitle(strings.bot.error)
				.setThumbnail(settings.images.error)
				.setDescription(
					`${strings.command.error}\nError for the developers:\n\`\`\`${error}\`\`\``,
				);

			let msgEmbed;
			try {
				msgEmbed = await interaction.reply({ embeds: [embed], fetchReply: true });
			} catch {
				// interaction already deferred, try following up instead
				msgEmbed = await interaction.followUp({ embeds: [embed], fetchReply: true });
			}

			return addDeleteButton(msgEmbed);
		}
	},
};
