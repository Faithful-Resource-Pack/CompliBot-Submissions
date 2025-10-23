import settings from "@resources/settings.json";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";
import { randomBytes } from "crypto";

import {
	mapDownloadableMessage,
	postContributions,
	addContributorRole,
	downloadTexture,
	generateContributionData,
} from "@submission/handleResults";
import pushTextures from "@submission/pushTextures";
import getPackByChannel from "@submission/utility/getPackByChannel";

import { submissionButtons } from "@helpers/interactions";
import formattedDate from "@helpers/formattedDate";

import type { PackFile } from "@interfaces/database";
import { Message, User, GuildMember, TextChannel } from "discord.js";
import { sendMessage } from "@submission/sendToChannel";
import { mapSendableMessage } from "@submission/utility/retrieveSubmission";

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
