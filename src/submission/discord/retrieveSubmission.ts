import { SubmissionStatus } from "@interfaces/submission";

import getSubmissions from "@helpers/getSubmissions";
import { Client } from "discord.js";

// +1 for bot's own reaction
export const DEFAULT_REACTION_COUNT = 1;

/**
 * Filter submissions from a given date and split by vote counts
 * @author Juknum
 * @param client
 * @param channelID where to retrieve from
 * @param delay delay in days from day of retrieval
 * @returns found messages split by vote count
 */
export default async function retrieveSubmission(client: Client, channelID: string, delay: number) {
	const delayedDate = new Date();
	delayedDate.setDate(delayedDate.getDate() - delay);

	const submissions = await getSubmissions(
		client,
		channelID,
		(submission) =>
			submission.status === SubmissionStatus.Pending && submission.isFromDate(delayedDate),
	);

	const upvotedSubmissions = submissions.filter(
		({ votes }) =>
			votes.upvotes > votes.upvotes ||
			// if nobody voted assume nobody cares
			(votes.upvotes === DEFAULT_REACTION_COUNT && votes.downvotes === DEFAULT_REACTION_COUNT),
	);

	return {
		upvotedSubmissions,
		// whatever isn't in messagesUpvoted is denied (reduces redundancy this way)
		downvotedSubmissions: submissions.filter((msg) => !upvotedSubmissions.includes(msg)),
	};
}
