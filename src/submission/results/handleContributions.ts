import { Contribution } from "@interfaces/database";

import { Client, GuildMember } from "discord.js";
import axios from "axios";
import { TextureSubmission } from "@submission/TextureSubmission";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Add a contributor role to users without one
 * @author Evorp
 * @param client
 * @param pack different packs have different roles
 * @param guildID where to add the role to
 * @param authors which authors to add roles to
 */
export function addContributorRole(
	client: Client,
	guildID: string,
	roleID: string,
	authors: string[],
) {
	const guild = client.guilds.cache.get(guildID);

	// guild couldn't be fetched or no role exists
	if (!guild || !roleID) return;

	// Promise.all is faster than awaiting separately + less error handling needed
	return Promise.all(
		authors
			.map((author) => guild.members.cache.get(author))
			.filter((user): user is GuildMember => user !== undefined && !user.roles.cache.has(roleID))
			.map((user) => user.roles.add(roleID).catch(() => {})),
	);
}

/**
 * Converts a mapped message to a contribution
 * @author Juknum
 * @param submission texture message
 * @param pack contribution pack
 * @returns postable contribution
 */
export const generateContributionData = (submission: TextureSubmission): Contribution => ({
	date: submission.date.getTime(),
	pack: submission.pack.id,
	texture: submission.id,
	authors: submission.authors,
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
