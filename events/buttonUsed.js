const { magnifyToAttachment } = require("@images/magnify");
const tile = require("@images/tile");
const palette = require("@images/palette");
const difference = require("@images/difference");

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const strings = require("@resources/strings.json");
const settings = require("@resources/settings.json");
const getPackByChannel = require("@submission/utility/getPackByChannel");
const warnUser = require("@helpers/warnUser");

/**
 * "fake" emitted event to split up interactionCreate
 * @type {import("@helpers/jsdoc").Event}
 */
module.exports = {
	name: "buttonUsed",
	/** @param {import("discord.js").ButtonInteraction} interaction */
	async execute(interaction) {
		const message = interaction.message;
		const image =
			interaction.message?.embeds[0]?.thumbnail?.url ??
			interaction.message.attachments.first()?.url;

		switch (interaction.customId) {
			case "magnifyButton":
				return await interaction.reply({
					files: [await magnifyToAttachment(image)],
					ephemeral: true,
				});
			case "tileButton":
				// tile + magnify
				const tileBuffer = await tile(interaction, image);
				if (!tileBuffer) return;
				return await interaction.reply({
					files: [await magnifyToAttachment(tileBuffer)],
					ephemeral: true,
				});
			case "paletteButton":
				// since there's multiple components in palette it's easier to reply there
				return palette(interaction, image);
			case "viewRawButton": // compatibility with old submissions
			case "diffButton":
				const packName = getPackByChannel(message.channel.id);

				const id = message.embeds?.[0]?.title?.match(/(?<=\[#)(.*?)(?=\])/)?.[0];
				if (!id) break;
				await interaction.deferReply({ ephemeral: true });

				const currentUrl = `${process.env.API_URL}textures/${id}/url/${packName}/latest`;
				const proposedUrl = message.embeds[0].thumbnail?.url;

				const diff = await difference(currentUrl, proposedUrl);
				if (!diff || !proposedUrl) {
					return await warnUser(
						interaction,
						"There is no existing texture to find the difference of!",
						true,
					);
				}
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("Image Difference")
							.setDescription(
								"- Blue: Changed pixels\n- Green: Added pixels\n- Red: Removed pixels",
							)
							.setColor(settings.colors.blue)
							.setImage("attachment://diff.png"),
					],
					files: [diff],
					ephemeral: true,
				});

			case "deleteButton":
				let original = interaction.message.interaction?.user;

				// no interaction found, try replies instead
				if (message?.reference && !original) {
					try {
						original = (await message.channel.messages.fetch(message.reference.messageId))?.author;
					} catch {
						// message deleted
					}
				}

				// if there's no way to determine the author we can assume anyone can delete it
				if (
					message.deletable &&
					(!original ||
						interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
						original.id == interaction.user.id)
				)
					return await message.delete();

				const user = original?.id ? `<@${original.id}>` : "another user";

				return await interaction.reply({
					content: `This interaction is reserved for ${user}!`,
					ephemeral: true,
				});
			default:
				return await warnUser(
					interaction,
					strings.bot.missing_interaction.replace("%INTERACTION%", "button"),
				);
		}
	},
};
