import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import { defineEvent } from "@interfaces/discord";

import { magnifyToAttachment } from "@images/magnify";
import tile from "@images/tile";
import palette from "@images/palette";
import difference from "@images/difference";
import info from "@commands/bot/info";

import getPackByChannel from "@submission/discord/getPackByChannel";
import { hasPermission, PermissionType } from "@helpers/permissions";
import warnUser from "@helpers/warnUser";

import { EmbedBuilder, GuildMember, MessageFlags } from "discord.js";

/** "fake" emitted event to split up interactionCreate */
export default defineEvent({
	name: "buttonUsed",
	async execute(interaction) {
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
				const submittedUrl = message.embeds[0].thumbnail?.url || "";

				const diff = await difference(currentUrl, submittedUrl);
				if (!diff || !submittedUrl) {
					return warnUser(interaction, strings.command.difference.no_texture, true);
				}
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle(
								strings.command.difference.title.replace("%TEXTURE%", message.embeds[0].title),
							)
							.setDescription(strings.command.difference.description)
							.setFooter({ text: strings.command.difference.footer })
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
					content: strings.global.reserved_interaction.replace("%USER%", user),
					flags: MessageFlags.Ephemeral,
				});
			}
			default: {
				return warnUser(
					interaction,
					strings.global.missing_interaction.replace("%INTERACTION%", "button"),
				);
			}
		}
	},
});
