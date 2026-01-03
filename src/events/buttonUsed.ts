import strings from "@resources/strings.json";
import settings from "@resources/settings.json";
import type { Event } from "@interfaces/discord";

import { magnifyToAttachment } from "@images/magnify";
import tile from "@images/tile";
import palette from "@images/palette";
import { difference } from "@images/difference";
import info from "@commands/bot/info";

import getPackByChannel from "@submission/discord/getPackByChannel";
import { hasPermission, PermissionType } from "@helpers/permissions";
import warnUser from "@helpers/warnUser";

import { ButtonInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";

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
				if (!image) break;
				return interaction.reply({
					files: [await magnifyToAttachment(image)],
					flags: MessageFlags.Ephemeral,
				});
			}
			case "tileButton": {
				if (!image) break;
				// tile + magnify
				const tileBuffer = await tile(interaction, image);
				if (!tileBuffer) break;
				return interaction.reply({
					files: [await magnifyToAttachment(tileBuffer)],
					flags: MessageFlags.Ephemeral,
				});
			}
			case "paletteButton": {
				if (!image) break;
				// since there's multiple components in palette it's easier to reply there
				return palette(interaction, image);
			}
			case "infoButton": {
				// the only method used is reply which is shared by buttons and commands
				return info.execute(interaction as any);
			}
			case "viewRawButton": // compatibility with old submissions
			case "diffButton": {
				const pack = getPackByChannel(message.channel.id);

				const id = message.embeds?.[0]?.title?.match(/(?<=\[#)(.*?)(?=\])/)?.[0];
				if (!id) break;
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });

				const currentUrl = `${process.env.API_URL}textures/${id}/url/${pack.id}/latest`;
				const proposedUrl = message.embeds[0].thumbnail?.url || "";

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
							.setTitle(`Texture Comparison for ${message.embeds[0].title}`)
							.setDescription(
								"- Blue: Changed pixels\n- Green: Added pixels\n- Red: Removed pixels",
							)
							.setFooter({ text: "Algorithm made by Ewan Howell" })
							.setColor(settings.colors.blue)
							.setImage("attachment://diff.png"),
					],
					files: [diff],
				});
			}
			case "deleteButton": {
				let originalAuthor = interaction.message.interactionMetadata?.user;

				// no interaction found, try replies instead
				if (message?.reference && !originalAuthor) {
					try {
						const originalID = message.reference.messageId;
						if (originalID)
							originalAuthor = (await message.channel.messages.fetch(originalID))?.author;
					} catch {
						// message deleted
					}
				}

				// if there's no way to determine the author we can assume anyone can delete it
				if (
					message.deletable &&
					(!originalAuthor ||
						hasPermission(interaction.member as GuildMember, PermissionType.Moderator) ||
						originalAuthor.id === interaction.user.id)
				)
					return message.delete();

				const user = originalAuthor?.id ? `<@${originalAuthor.id}>` : "another user";

				return interaction.reply({
					content: `This interaction is reserved for ${user}!`,
					flags: MessageFlags.Ephemeral,
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
