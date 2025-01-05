import { magnifyToAttachment } from "@images/magnify";
import tile from "@images/tile";
import palette from "@images/palette";
import { difference } from "@images/difference";

import { ButtonInteraction, EmbedBuilder, GuildMember } from "discord.js";

import strings from "@resources/strings.json";
import settings from "@resources/settings.json";
import getPackByChannel from "@submission/utility/getPackByChannel";
import warnUser from "@helpers/warnUser";
import type { Event } from "@interfaces/discord";
import { hasPermission } from "@helpers/permissions";

/** "fake" emitted event to split up interactionCreate */
export default {
	name: "buttonUsed",
	async execute(interaction: ButtonInteraction) {
		const message = interaction.message;
		const image =
			interaction.message?.embeds[0]?.thumbnail?.url ??
			interaction.message.attachments.first()?.url;

		// curly brackets used to fix scoping issues
		switch (interaction.customId) {
			case "magnifyButton": {
				return interaction.reply({
					files: [await magnifyToAttachment(image)],
					ephemeral: true,
				});
			}
			case "tileButton": {
				// tile + magnify
				const tileBuffer = await tile(interaction, image);
				if (!tileBuffer) return;
				return interaction.reply({
					files: [await magnifyToAttachment(tileBuffer)],
					ephemeral: true,
				});
			}
			case "paletteButton": {
				// since there's multiple components in palette it's easier to reply there
				return palette(interaction, image);
			}
			case "viewRawButton": // compatibility with old submissions
			case "diffButton": {
				const packName = getPackByChannel(message.channel.id);

				const id = message.embeds?.[0]?.title?.match(/(?<=\[#)(.*?)(?=\])/)?.[0];
				if (!id) break;
				await interaction.deferReply({ ephemeral: true });

				const currentUrl = `${process.env.API_URL}textures/${id}/url/${packName}/latest`;
				const proposedUrl = message.embeds[0].thumbnail?.url;

				const diff = await difference(currentUrl, proposedUrl);
				if (!diff || !proposedUrl) {
					return warnUser(
						interaction,
						"There is no existing texture to find the difference of!",
						true,
					);
				}
				return interaction.editReply({
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
				});
			}
			case "deleteButton": {
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
						hasPermission(interaction.member as GuildMember, "moderator") ||
						original.id === interaction.user.id)
				)
					return message.delete();

				const user = original?.id ? `<@${original.id}>` : "another user";

				return interaction.reply({
					content: `This interaction is reserved for ${user}!`,
					ephemeral: true,
				});
			}
			default: {
				return warnUser(
					interaction,
					strings.bot.missing_interaction.replace("%INTERACTION%", "button"),
				);
			}
		}
	},
} as Event;
