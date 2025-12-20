import strings from "@resources/strings.json";

import getSubmissionData, { SubmissionCreationData } from "@submission/creation/getSubmissionData";
import cancelSubmission from "@submission/creation/cancelSubmission";
import makeEmbed from "@submission/creation/makeEmbed";
import choiceEmbed from "@submission/creation/choiceEmbed";

import versionRange from "@helpers/versionRange";

import { Message, SelectMenuComponentOptionData } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Create submission embeds from a message
 * @author Evorp
 * @param message message to embed
 */
export default async function submitTexture(message: Message<true>) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.image_not_attached);

	// process order doesn't matter as long as the index is known
	const rawSubmissionData = await Promise.all(
		Array.from(message.attachments.values(), (attachment, i) =>
			getSubmissionData(message, attachment, i).catch((err: string) =>
				cancelSubmission(message, err),
			),
		),
	);

	// filter images with errors
	const submissionData = rawSubmissionData.filter((res) => res !== undefined);
	await Promise.all(submissionData.map((data) => submitAttachment(message, data)));

	// can only delete message if there are no choice menus anywhere
	if (message.deletable && submissionData.every((data) => data.results.length === 1))
		await message.delete();
}

/**
 * Create a submission embed from searched submission data
 * @author Juknum, Evorp
 * @param message message to embed
 * @param params which attachment/texture to make the embed for
 */
export async function submitAttachment(
	message: Message<true>,
	{ results, index, name, ...params }: SubmissionCreationData,
) {
	if (results.length === 1) return makeEmbed(message, results[0], params);

	if (DEBUG) console.log(`Generating choice embed for texture search: ${name}`);
	const mappedResults = results.map<SelectMenuComponentOptionData>(({ id, name, paths }) => ({
		// usually the first path is the most important
		label: `[#${id}] (${versionRange(paths[0].versions)}) ${name}`,
		description: paths[0].name,
		value: `${id}__${index}`,
	}));

	return choiceEmbed(message, mappedResults);
}
