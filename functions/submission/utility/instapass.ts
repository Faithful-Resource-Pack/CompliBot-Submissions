import settings from "@resources/settings.json";

const DEBUG = process.env.DEBUG.toLowerCase() == "true";
import { randomBytes } from "crypto";

import {
	mapMessage,
	postContributions,
	addContributorRole,
	downloadTexture,
	generateContributionData,
} from "@submission/handleResults";
import pushTextures from "@submission/pushTextures";
import getPackByChannel from "@submission/utility/getPackByChannel";
import changeStatus from "@submission/utility/changeStatus";

import { imageButtons } from "@helpers/interactions";
import formattedDate from "@helpers/formattedDate";

import type { PackFile } from "@interfaces/database";
import { Message, User, GuildMember, TextChannel } from "discord.js";

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
	const status = `<:instapass:${settings.emojis.instapass}> Instapassed by <@${member.id}>`;

	const embed = await changeStatus(message, {
		status,
		color: settings.colors.yellow,
		components: [imageButtons],
		editOriginal: true,
	});

	const channelOut = (await message.client.channels.fetch(channelOutID)) as TextChannel;

	// if instapassed in council "original post" is already there
	if (!message.embeds[0].description?.startsWith("[Original Post]("))
		embed.setDescription(`[Original Post](${message.url})\n${message.embeds[0].description ?? ""}`);

	const texture = mapMessage(
		await channelOut.send({
			embeds: [embed],
			components: [imageButtons],
		}),
	);

	// random folder name so multiple textures can be instapassed at once
	const basePath = `./instapassedTextures/${randomBytes(6).toString("hex")}`;

	const textureInfo = await downloadTexture(texture, pack, basePath);

	// not awaited since not timebound
	postContributions(generateContributionData(texture, pack));
	addContributorRole(
		message.client,
		pack,
		(message.channel as TextChannel).guildId,
		texture.authors,
	);
	await pushTextures(basePath, pack.id, `Instapass ${textureInfo.name} from ${formattedDate()}`);

	if (DEBUG) console.log(`Texture instapassed: ${message.embeds[0].title}`);
}
