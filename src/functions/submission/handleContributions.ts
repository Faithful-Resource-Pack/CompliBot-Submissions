import { Contribution, Pack } from "@interfaces/database";
import { DownloadableMessage } from "@submission/handleResults";

import { Client } from "discord.js";
import axios from "axios";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Add a contributor role to users without one
 * @author Evorp
 * @param client
 * @param pack different packs have different roles
 * @param guildID where to add the role to
 * @param authors which authors to add roles to
 */
export function addContributorRole(client: Client, pack: Pack, guildID: string, authors: string[]) {
	const guild = client.guilds.cache.get(guildID);
	const role = pack.submission.contributor_role;

	// guild couldn't be fetched or no role exists
	if (!guild || !role) return;

	// Promise.all is faster than awaiting separately + less error handling needed
	return Promise.all(
		authors
			.map((author) => guild.members.cache.get(author))
			.filter((user) => user && !user.roles.cache.has(role))
			.map((user) => user.roles.add(role).catch(() => {})),
	);
}

/**
 * Converts a mapped message to a contribution
 * @author Juknum
 * @param texture texture message
 * @param pack contribution pack
 * @returns postable contribution
 */
export const generateContributionData = (
	texture: DownloadableMessage,
	pack: Pack,
): Contribution => ({
	date: texture.date,
	pack: pack.id,
	texture: texture.id,
	authors: texture.authors,
});

/**
 * Post contribution(s) to database
 * @author Evorp
 * @param contributions contributions to post
 */
export async function postContributions(...contributions: Contribution[]) {
	try {
		await axios.post(`${process.env.API_URL}contributions`, contributions, {
			headers: {
				bot: process.env.API_TOKEN,
			},
		});
		if (DEBUG) console.log(`Added contribution(s): ${JSON.stringify(contributions, null, 4)}`);
	} catch {
		if (DEBUG) {
			console.error(`Failed to add contribution(s) for pack: ${contributions[0]?.pack}`);
			console.error(JSON.stringify(contributions, null, 4));
		}
	}
}
