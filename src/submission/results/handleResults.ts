import settings from "@resources/settings.json";

import type { Contribution, PackFile } from "@interfaces/database";

import {
	addContributorRole,
	generateContributionData,
	postContributions,
} from "@submission/results/handleContributions";
import downloadTexture from "@submission/results/downloadTexture";
import getPackByChannel from "@submission/discord/getPackByChannel";

import getMessages from "@helpers/getMessages";
import handleError from "@functions/handleError";

import { TextChannel, Client, Message } from "discord.js";

export interface DownloadableMessage {
	url: string;
	authors: string[];
	date: number;
	id: string; // texture id
}

/**
 * Download passed submissions and add contributions/roles
 * @author Juknum, Evorp
 * @param client
 * @param channelResultID result channel to download from
 * @param addContributions whether to add contributions or not
 */
export async function handleResults(
	client: Client,
	channelResultID: string,
	addContributions = true,
) {
	const packs: PackFile = require("@resources/packs.json");
	const pack = packs[getPackByChannel(channelResultID)];

	// get messages from the same day
	const delayedDate = new Date();
	const messages = await getMessages(client, channelResultID, (message) => {
		const messageDate = new Date(message.createdTimestamp);
		return (
			// correct date
			messageDate.getDate() === delayedDate.getDate() &&
			messageDate.getMonth() === delayedDate.getMonth() &&
			messageDate.getFullYear() === delayedDate.getFullYear() &&
			// is an accepted submission
			message.embeds?.[0]?.fields?.[1]?.value?.includes(settings.emojis.upvote)
		);
	});

	// filter out duplicates first based on date-sorted array so we can do everything concurrently
	const uniqueTextures = Object.values(
		messages.map(mapDownloadableMessage).reduce<Record<string, DownloadableMessage>>((acc, cur) => {
			acc[cur.id] = cur;
			return acc;
		}, {}),
	);

	const allContributions: (Contribution | undefined)[] = await Promise.all(
		uniqueTextures.map((texture) =>
			downloadTexture(texture, pack, "./downloadedTextures")
				// only create contribution data if the texture download succeeded
				.then(() => generateContributionData(texture, pack))
				.catch(
					(err: unknown) =>
						void handleError(
							client,
							err,
							`Failed to download texture [#${texture.id}] for pack ${pack.name}`,
						),
				),
		),
	);

	if (!addContributions) return;

	const addedContributions = allContributions.filter(
		// typescript trick for a type-safe filter cast
		(c): c is Contribution => c !== undefined,
	);

	// post all contributions at once (saves on requests) only if there's something to post
	if (addedContributions.length) {
		const guildID = (client.channels.cache.get(channelResultID) as TextChannel).guildId;
		return Promise.all([
			postContributions(...addedContributions),
			...addedContributions.map((c) => addContributorRole(client, pack, guildID, c.authors)),
		]);
	}
}

/**
 * Map a texture to a downloadable format
 * @author Juknum
 * @param message message to map
 * @returns downloadable message
 */
export const mapDownloadableMessage = (message: Message): DownloadableMessage => ({
	url: message.embeds[0].thumbnail?.url || "",
	// only get the numbers (discord id)
	authors: message.embeds[0].fields[0].value
		.split("\n")
		.map((author) => author.match(/\d+/g)?.[0] || ""),
	date: message.createdTimestamp,
	id: message.embeds[0].title?.match(/(?<=\[#)(.*?)(?=\])/)?.[0] || "",
});
