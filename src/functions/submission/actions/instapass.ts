import settings from "@resources/settings.json";

import { randomBytes } from "crypto";

import type { PackFile } from "@interfaces/database";

import getPackByChannel from "@submission/discord/getPackByChannel";
import { mapSendableMessage } from "@submission/discord/retrieveSubmission";
import { sendMessage } from "@submission/discord/sendToChannel";

import { mapDownloadableMessage } from "@submission/results/handleResults";
import { downloadTexture } from "@submission/results/downloadTexture";
import {
	addContributorRole,
	generateContributionData,
	postContributions,
} from "@submission/results/handleContributions";
import pushTextures from "@submission/results/pushTextures";

import { submissionButtons } from "@helpers/interactions";
import formattedDate from "@helpers/formattedDate";

import { Message, User, GuildMember, TextChannel } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Instapass a given texture embed
 * @author Evorp
 * @param message embed to instapass
 * @param member who instapassed it
 */
export default async function instapass(message: Message, member: User | GuildMember) {
	const packs: PackFile = require("@resources/packs.json");
	const pack = packs[getPackByChannel(message.channel.id)];

	const channelOutID = pack.submission.channels.results;
	const channelOut = (await message.client.channels.fetch(channelOutID)) as TextChannel;

	const status = `Instapassed by <@${member.id}>`;
	const resultMessage = await sendMessage(mapSendableMessage(message), channelOut, {
		color: settings.colors.yellow,
		emoji: `<:instapass:${settings.emojis.instapass}>`,
		components: [submissionButtons],
		// same result/original status
		originalStatus: status,
		resultStatus: status,
	});

	const texture = mapDownloadableMessage(resultMessage);

	// random folder name so multiple textures can be instapassed at once
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	const textureInfo = await downloadTexture(texture, pack, basePath);

	// use allSettled so if one throws the others don't abort
	await Promise.allSettled([
		pushTextures(basePath, pack.id, `Instapass ${textureInfo.name} from ${formattedDate()}`),
		postContributions(generateContributionData(texture, pack)),
		addContributorRole(message.client, pack, channelOut.guildId, texture.authors),
	]);

	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
}
