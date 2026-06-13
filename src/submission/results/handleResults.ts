import type { Contribution } from "@interfaces/database";

import {
	addContributorRole,
	generateContributionData,
	postContributions,
} from "@submission/results/handleContributions";
import downloadTexture from "@submission/results/downloadTexture";
import { SubmissionStatus, TextureSubmission } from "@interfaces/submission";

import getSubmissions from "@helpers/getSubmissions";
import handleError from "@functions/handleError";

import { TextChannel, Client } from "discord.js";

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
	// only read new messages
	const currentDate = new Date();
	const submissions = await getSubmissions(
		client,
		channelResultID,
		(submission) =>
			submission.isFromDate(currentDate) && submission.status === SubmissionStatus.Approved,
	);

	// filter out duplicates first based on date-sorted array so we can do everything concurrently
	const uniqueSubmissions = Object.values(
		submissions.reduce<Record<string, TextureSubmission>>((acc, cur) => {
			acc[cur.id] = cur;
			return acc;
		}, {}),
	);

	const allContributions: (Contribution | undefined)[] = await Promise.all(
		uniqueSubmissions.map((submission) =>
			downloadTexture(submission, "./downloadedTextures")
				// only create contribution data if the texture download succeeded
				.then(() => generateContributionData(submission))
				.catch(
					(err: unknown) =>
						void handleError(
							client,
							err,
							`Failed to download texture [#${submission.id}] for pack ${submission.pack.name}`,
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

		// we know at least one submission exists if there's contributions to add
		const roleID = uniqueSubmissions[0].pack.submission.contributor_role;

		return Promise.all([
			postContributions(...addedContributions),
			addContributorRole(
				client,
				guildID,
				roleID,
				addedContributions.flatMap((c) => c.authors),
			),
		]);
	}
}
