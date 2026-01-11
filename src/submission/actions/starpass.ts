import settings from "@resources/settings.json";

import { instapassMessages } from "@submission/actions/instapass";
import { editEmbed } from "@submission/discord/changeStatus";
import getPackByChannel from "@submission/discord/getPackByChannel";

import { submissionButtons } from "@helpers/interactions";

import { EmbedBuilder, Message, MessageCreateOptions, TextChannel } from "discord.js";
import { hasPermission, PermissionType } from "@helpers/permissions";

/**
 * Instapass submission embeds with a progress bar
 * @author Evorp
 * @param message Original submission message
 * @param embedsToInstapass Generated embeds
 */
export default async function starpass(
	message: Message<true>,
	embedsToInstapass: MessageCreateOptions["embeds"],
) {
	const textureStr = embedsToInstapass.length == 1 ? "texture" : "textures";

	const statusMessage = await message.channel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle(`Instapassing ${textureStr}…`)
				.setDescription("This can take some time, please wait…")
				.setThumbnail(settings.images.loading)
				.setColor(settings.colors.blue),
		],
	});

	const pack = getPackByChannel(message.channel.id);
	const resultChannel = message.client.channels.cache.get(
		pack.submission.channels.results,
	) as TextChannel;

	const status = `Instapassed by <@${message.author.id}>`;
	const resultMessagesToInstapass = await Promise.all(
		embedsToInstapass.map((embed) => {
			// todo: try to merge this with the instapass action
			const edited = editEmbed(embed, {
				color: settings.colors.yellow,
				status: `<:instapass:${settings.emojis.instapass}> ${status}`,
			});
			return resultChannel.send({
				embeds: [edited],
				components: [submissionButtons],
			});
		}),
	);

	await instapassMessages(resultMessagesToInstapass, pack);
	const notificationEmbed = new EmbedBuilder()
		.setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
		.setTitle(`Instapassed ${embedsToInstapass.length} ${textureStr}`)
		.setDescription(
			resultMessagesToInstapass
				.map((message) => `[${EmbedBuilder.from(message.embeds[0]).data.title}](${message.url})`)
				.join("\n"),
		)
		.setColor(settings.colors.yellow)
		.addFields({
			name: "Reason",
			value: message.content.slice(1).trim() || "*No reason provided*",
		});

	return statusMessage.edit({ embeds: [notificationEmbed] });
}

/**
 * Check whether a message can be instapassed immediately
 * @author Evorp
 * @param message Submission message
 * @returns whether the user requested and is allowed to instapass the texture
 */
export const canStarpass = (message: Message<true>) =>
	message.content.startsWith("*") &&
	// don't match italics
	message.content.match(/\*/g)?.length === 1 &&
	hasPermission(message.guild.members.cache.get(message.author.id), PermissionType.Submission);
