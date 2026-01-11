import settings from "@resources/settings.json";

import { randomBytes } from "crypto";

import type { Pack } from "@interfaces/database";

import getPackByChannel from "@submission/discord/getPackByChannel";
import { mapSendableMessage } from "@submission/discord/retrieveSubmission";
import { sendMessage } from "@submission/discord/sendToChannel";

import { mapDownloadableMessage } from "@submission/results/handleResults";
import downloadTexture from "@submission/results/downloadTexture";
import {
	addContributorRole,
	generateContributionData,
	postContributions,
} from "@submission/results/handleContributions";
import pushTextures from "@submission/results/pushTextures";

import { submissionButtons } from "@helpers/interactions";
import formattedDate from "@helpers/formattedDate";
import listify from "@helpers/listify";

import { Message, User, GuildMember, TextChannel } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Instapass a given texture embed
 * @author Evorp
 * @param message embed to instapass
 * @param member who instapassed it
 */
export default async function instapass(message: Message<true>, member: User | GuildMember) {
	const pack = getPackByChannel(message.channel.id);

	const channelOutID = pack.submission.channels.results;
	const channelOut = message.client.channels.cache.get(channelOutID) as TextChannel;

	const status = `Instapassed by <@${member.id}>`;
	const resultMessage = await sendMessage(mapSendableMessage(message), channelOut, {
		color: settings.colors.yellow,
		emoji: `<:instapass:${settings.emojis.instapass}>`,
		components: [submissionButtons],
		// same result/original status
		originalStatus: status,
		resultStatus: status,
	});

	return instapassMessages([resultMessage], pack);
}

export const MAX_SHOWN_TEXTURES = 3;

/**
 * Instantly pass a series of result messages
 * @author Evorp
 * @param messages Messages to instapass
 * @param pack Pack to instapass to
 */
export async function instapassMessages(messages: Message<true>[], pack: Pack) {
	if (!messages.length) return;
	const textures = messages.map(mapDownloadableMessage);

	// random folder name so multiple textures can be instapassed at once
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	const textureInformation = await Promise.all(
		textures.map((texture) => downloadTexture(texture, pack, basePath)),
	);

	const commitNames = textureInformation.map((t) => t.name).slice(0, MAX_SHOWN_TEXTURES);
	if (textureInformation.length > MAX_SHOWN_TEXTURES)
		commitNames.push(`${textureInformation.length - MAX_SHOWN_TEXTURES} more`);

	// use allSettled so if one throws the others don't abort
	await Promise.allSettled([
		pushTextures(basePath, pack.id, `Instapass ${listify(commitNames)} from ${formattedDate()}`),
		textures.flatMap((texture) => postContributions(generateContributionData(texture, pack))),
		// guaranteed at least one message from start check
		addContributorRole(
			messages[0].client,
			pack,
			messages[0].channel.guildId,
			textures.flatMap((tex) => tex.authors),
		),
	]);

	if (DEBUG)
		console.log(
			`Textures instapassed:\n${textureInformation.map((t) => `- [#${t.id}] ${t.name}`).join("\n")}`,
		);
}
