import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { SubmissionSource } from "@interfaces/discord";

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
 * @param reason Submission description to use as reason
 * @param embedsToInstapass Generated embeds
 */
export default async function starpass(
	message: SubmissionSource,
	reason: string,
	embedsToInstapass: MessageCreateOptions["embeds"],
) {
	const style = embedsToInstapass.length === 1 ? "singular" : "plural";
	const statusMessage = await message.channel.send({
		embeds: [
			new EmbedBuilder()
				.setTitle(
					strings.submission.starpass.progress_title[style].replace(
						"%COUNT%",
						String(embedsToInstapass.length),
					),
				)
				.setDescription(strings.global.progress_description)
				.setThumbnail(settings.images.loading)
				.setColor(settings.colors.blue),
		],
	});

	const pack = getPackByChannel(message.channel.id);
	const resultChannel = message.client.channels.cache.get(
		pack.submission.channels.results,
	) as TextChannel;

	const status = strings.submission.status.instapassed.replace("%USER%", `<@${message.member.id}>`);
	const resultMessagesToInstapass = await Promise.all(
		embedsToInstapass.map((embed) => {
			// todo: try to merge this with sendMessage
			const edited = editEmbed(embed, {
				color: settings.colors.yellow,
				status: `<:instapass:${settings.emojis.instapass}> ${status}`,
			});
			edited.setDescription(
				`[${strings.submission.field.original_post}](${statusMessage.url})\n${edited.data.description ?? ""}`,
			);
			return resultChannel.send({
				embeds: [edited],
				components: [submissionButtons],
			});
		}),
	);

	await instapassMessages(resultMessagesToInstapass, pack);

	const author = message instanceof Message ? message.author : message.user;
	const notificationEmbed = new EmbedBuilder()
		.setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
		.setTitle(
			strings.submission.starpass.finished_title[style].replace(
				"%COUNT%",
				String(embedsToInstapass.length),
			),
		)
		.setDescription(
			resultMessagesToInstapass
				.map((message) => `[${message.embeds[0].title}](${message.url})`)
				.join("\n"),
		)
		.setColor(settings.colors.yellow)
		.addFields({
			name: strings.submission.field.reason,
			value: reason || strings.submission.starpass.no_reason,
		});

	// show thumbnail if there's only one texture (no ambiguity)
	if (embedsToInstapass.length === 1)
		notificationEmbed.setThumbnail(EmbedBuilder.from(embedsToInstapass[0]).data.thumbnail.url);

	return statusMessage.edit({ embeds: [notificationEmbed] });
}

/**
 * Check whether a message should be instapassed immediately
 * @author Evorp
 * @param message Submission message
 * @returns whether the user requested and is allowed to instapass the texture
 */
export const shouldStarpass = (message: Message<true>) =>
	message.content.startsWith("*") &&
	// don't match italics
	message.content.match(/\*/g)?.length === 1 &&
	hasPermission(message.guild.members.cache.get(message.author.id), PermissionType.Submission);
